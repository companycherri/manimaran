import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { Resend } from 'npm:resend@4.0.0';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- Low-level send helpers (no automatic retries — avoids duplicate sends) ---

async function sendViaResend(resend, from, to, subject, html) {
  if (!resend) return { to, sent: false, error: 'Resend client not initialized' };
  console.log(`Resend: attempting send from="${from}" to="${to}"`);
  try {
    const result = await resend.emails.send({ from, to, subject, html });
    console.log(`Resend result for ${to}: ${JSON.stringify(result)}`);
    if (!result.error) {
      console.log(`✅ Resend: sent to ${to}`);
      return { to, sent: true, provider: 'resend' };
    }
    const errMsg = result.error?.message || 'Unknown Resend error';
    console.error(`❌ Resend failed for ${to}: ${errMsg} (name: ${result.error?.name})`);
    return { to, sent: false, provider: 'resend', error: errMsg };
  } catch (e) {
    console.error(`❌ Resend threw for ${to}: ${e.message}`);
    return { to, sent: false, provider: 'resend', error: e.message };
  }
}

async function sendViaBase44(base44, to, subject, html, siteName) {
  try {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to, subject, body: html, from_name: siteName,
    });
    console.log(`✅ Base44 email: sent to ${to}`);
    return { to, sent: true, provider: 'base44' };
  } catch (e) {
    console.warn(`Base44 email failed for ${to}: ${e.message}`);
    return { to, sent: false, provider: 'base44', error: e.message };
  }
}

// Try Resend first; on failure fall back to Base44. Returns the winning result,
// or a combined failure object showing the exact reason from each provider.
async function deliver(resend, from, base44, siteName, to, subject, html) {
  let resendResult = null;
  if (resend) {
    resendResult = await sendViaResend(resend, from, to, subject, html);
    if (resendResult.sent) return resendResult;
  }
  const base44Result = await sendViaBase44(base44, to, subject, html, siteName);
  if (base44Result.sent) return base44Result;
  // Both failed — surface every reason for diagnostics
  return {
    to, sent: false,
    resend_error: resendResult ? resendResult.error : 'Resend not configured',
    base44_error: base44Result ? base44Result.error : 'Base44 not attempted',
    error: `Resend: ${resendResult ? resendResult.error : 'not configured'} | Base44: ${base44Result ? base44Result.error : 'not attempted'}`,
  };
}

// --- Field helpers ---

function formatDateTime(value) {
  if (!value) return 'N/A';
  try {
    const d = new Date(value);
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  } catch {
    return String(value);
  }
}

function getPaymentMethod(order) {
  if (order.razorpay_order_id || order.payment_id) return 'Razorpay (Online)';
  if (order.payment_status === 'completed') return 'Online';
  return 'N/A';
}

function titleCase(s) {
  return String(s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// --- Reusable email service methods ---

async function sendCustomerInvoice({ order, customerEmail, resend, from, base44, siteName, siteLogo }) {
  const subject = `Your Manimaran Palgova Order Invoice - #${order.order_number}`;

  const itemsRows = (order.items || []).map(item => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #F0E5D8;color:#5C4033;">${item.product_name || 'N/A'}</td>
      <td style="padding:12px;border-bottom:1px solid #F0E5D8;color:#5C4033;text-align:center;">${item.quantity || 0}</td>
      <td style="padding:12px;border-bottom:1px solid #F0E5D8;color:#5C4033;text-align:right;">₹${Number(item.unit_price || 0).toFixed(2)}</td>
      <td style="padding:12px;border-bottom:1px solid #F0E5D8;color:#5C4033;text-align:right;">₹${((item.unit_price || 0) * (item.quantity || 1)).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
  <!DOCTYPE html>
  <html><head><meta charset="UTF-8"></head>
  <body style="margin:0;padding:0;background:#FFF8E7;font-family:Arial,sans-serif;">
    <div style="max-width:650px;margin:20px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(92,64,51,0.1);border:2px solid #E8D5C4;">
      <div style="background:linear-gradient(135deg,#5C4033 0%,#8B6F47 100%);padding:30px 20px;text-align:center;">
        ${siteLogo ? `<img src="${siteLogo}" alt="Logo" style="width:70px;height:70px;object-fit:contain;margin-bottom:10px;" />` : ''}
        <div style="color:#FFD700;font-size:26px;font-weight:bold;font-family:Georgia,serif;">${siteName}</div>
        <div style="color:#FFF8E7;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-top:4px;">Authentic Indian Sweets</div>
        <div style="color:#FFD700;font-size:20px;font-weight:bold;margin-top:16px;text-transform:uppercase;letter-spacing:1px;">Order Invoice</div>
      </div>
      <div style="padding:30px;border-bottom:1px solid #F0E5D8;">
        <table style="width:100%;">
          <tr>
            <td style="vertical-align:top;">
              <p style="margin:6px 0;color:#5C4033;font-size:14px;"><strong>Order ID:</strong> ${order.order_number}</p>
              <p style="margin:6px 0;color:#5C4033;font-size:14px;"><strong>Date &amp; Time:</strong> ${formatDateTime(order.order_date || order.created_date)}</p>
              <p style="margin:6px 0;color:#5C4033;font-size:14px;"><strong>Customer Name:</strong> ${order.customer_name || 'N/A'}</p>
              <p style="margin:6px 0;color:#5C4033;font-size:14px;"><strong>Mobile Number:</strong> ${order.customer_phone || 'N/A'}</p>
              <p style="margin:6px 0;color:#5C4033;font-size:14px;"><strong>Email:</strong> ${customerEmail || 'N/A'}</p>
            </td>
            <td style="vertical-align:top;text-align:right;">
              <p style="margin:6px 0;color:#5C4033;font-size:14px;"><strong>Order Status:</strong> ${titleCase(order.status)}</p>
              <p style="margin:6px 0;color:#5C4033;font-size:14px;"><strong>Payment Method:</strong> ${getPaymentMethod(order)}</p>
              <p style="margin:6px 0;color:#5C4033;font-size:14px;"><strong>Payment Status:</strong> ${titleCase(order.payment_status)}</p>
            </td>
          </tr>
        </table>
      </div>
      <div style="padding:30px;">
        <table style="width:100%;border-collapse:collapse;border:1px solid #E8D5C4;">
          <thead>
            <tr style="background:#FFD700;">
              <th style="padding:12px;text-align:left;color:#5C4033;font-size:13px;text-transform:uppercase;">Product</th>
              <th style="padding:12px;text-align:center;color:#5C4033;font-size:13px;text-transform:uppercase;">Qty</th>
              <th style="padding:12px;text-align:right;color:#5C4033;font-size:13px;text-transform:uppercase;">Unit Price</th>
              <th style="padding:12px;text-align:right;color:#5C4033;font-size:13px;text-transform:uppercase;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemsRows}</tbody>
        </table>
        <table style="width:100%;border:1px solid #E8D5C4;border-top:none;">
          <tr style="border-top:2px solid #FFD700;">
            <td style="padding:14px 16px;text-align:right;color:#5C4033;font-size:16px;font-weight:bold;">Total Amount:</td>
            <td style="padding:14px 16px;text-align:right;color:#FFD700;font-size:18px;font-weight:bold;width:130px;">₹${Number(order.total_amount || 0).toFixed(2)}</td>
          </tr>
        </table>
        <div style="margin-top:24px;padding:16px 20px;background:#FFF8E7;border-radius:10px;border:1px solid #E8D5C4;">
          <h3 style="color:#5C4033;margin:0 0 10px;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Delivery Address</h3>
          <p style="margin:4px 0;color:#5C4033;font-size:14px;"><strong>Name:</strong> ${order.customer_name || 'N/A'}</p>
          <p style="margin:4px 0;color:#5C4033;font-size:14px;"><strong>Phone:</strong> ${order.customer_phone || 'N/A'}</p>
          <p style="margin:4px 0;color:#5C4033;font-size:14px;"><strong>Address:</strong> ${order.delivery_address || 'N/A'}</p>
        </div>
      </div>
      <div style="background:#5C4033;padding:24px;text-align:center;color:#FFF8E7;">
        <p style="margin:4px 0;font-size:14px;">Thank you for choosing <strong>${siteName}</strong>!</p>
        <p style="margin:4px 0;font-size:13px;color:#FED800;">We'll prepare your order with love and care. 🍬</p>
        <p style="margin:12px 0 0;font-size:11px;color:#FFF8E7;opacity:0.7;">This is an automated invoice. Please do not reply to this email.</p>
      </div>
    </div>
  </body></html>`;

  return deliver(resend, from, base44, siteName, customerEmail, subject, html);
}

async function sendClientOrderNotification({ order, customerEmail, adminEmail, resend, from, base44, siteName, siteLogo }) {
  const subject = `New Order Received - #${order.order_number}`;

  const itemsRows = (order.items || []).map(item => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #F0E5D8;color:#5C4033;">${item.product_name || 'N/A'}</td>
      <td style="padding:12px;border-bottom:1px solid #F0E5D8;color:#5C4033;text-align:center;">${item.quantity || 0}</td>
      <td style="padding:12px;border-bottom:1px solid #F0E5D8;color:#5C4033;text-align:right;">₹${Number(item.unit_price || 0).toFixed(2)}</td>
      <td style="padding:12px;border-bottom:1px solid #F0E5D8;color:#5C4033;text-align:right;">₹${((item.unit_price || 0) * (item.quantity || 1)).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
  <!DOCTYPE html>
  <html><head><meta charset="UTF-8"></head>
  <body style="margin:0;padding:0;background:#F4F4F4;font-family:Arial,sans-serif;">
    <div style="max-width:650px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);border:1px solid #E0E0E0;">
      <div style="background:#5C4033;padding:20px 24px;display:flex;align-items:center;gap:14px;">
        ${siteLogo ? `<img src="${siteLogo}" alt="Logo" style="width:48px;height:48px;object-fit:contain;" />` : ''}
        <div>
          <div style="color:#FFD700;font-size:20px;font-weight:bold;font-family:Georgia,serif;">${siteName}</div>
          <div style="color:#FFF8E7;font-size:12px;">New Order Notification</div>
        </div>
      </div>
      <div style="padding:24px 30px;">
        <p style="margin:0 0 16px;color:#5C4033;font-size:18px;font-weight:bold;">New Order Received</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr>
            <td style="vertical-align:top;width:50%;padding:6px 0;color:#444;font-size:14px;"><strong>Customer Name:</strong> ${order.customer_name || 'N/A'}</td>
            <td style="vertical-align:top;width:50%;padding:6px 0;color:#444;font-size:14px;"><strong>Order ID:</strong> ${order.order_number}</td>
          </tr>
          <tr>
            <td style="vertical-align:top;padding:6px 0;color:#444;font-size:14px;"><strong>Mobile Number:</strong> ${order.customer_phone || 'N/A'}</td>
            <td style="vertical-align:top;padding:6px 0;color:#444;font-size:14px;"><strong>Date &amp; Time:</strong> ${formatDateTime(order.order_date || order.created_date)}</td>
          </tr>
          <tr>
            <td style="vertical-align:top;padding:6px 0;color:#444;font-size:14px;"><strong>Email:</strong> ${customerEmail || 'N/A'}</td>
            <td style="vertical-align:top;padding:6px 0;color:#444;font-size:14px;"><strong>Order Total:</strong> ₹${Number(order.total_amount || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="vertical-align:top;padding:6px 0;color:#444;font-size:14px;"><strong>Payment Method:</strong> ${getPaymentMethod(order)}</td>
            <td style="vertical-align:top;padding:6px 0;color:#444;font-size:14px;"><strong>Payment Status:</strong> ${titleCase(order.payment_status)}</td>
          </tr>
          <tr>
            <td style="vertical-align:top;padding:6px 0;color:#444;font-size:14px;"><strong>Order Status:</strong> ${titleCase(order.status)}</td>
            <td></td>
          </tr>
          <tr>
            <td colspan="2" style="vertical-align:top;padding:6px 0;color:#444;font-size:14px;"><strong>Delivery Address:</strong> ${order.delivery_address || 'N/A'}</td>
          </tr>
        </table>

        <h3 style="color:#5C4033;font-size:14px;text-transform:uppercase;letter-spacing:1px;margin:24px 0 8px;border-bottom:2px solid #FFD700;padding-bottom:6px;">Ordered Products</h3>
        <table style="width:100%;border-collapse:collapse;border:1px solid #E8D5C4;">
          <thead>
            <tr style="background:#F5EDDC;">
              <th style="padding:10px;text-align:left;color:#5C4033;font-size:12px;text-transform:uppercase;">Product</th>
              <th style="padding:10px;text-align:center;color:#5C4033;font-size:12px;text-transform:uppercase;">Qty</th>
              <th style="padding:10px;text-align:right;color:#5C4033;font-size:12px;text-transform:uppercase;">Price</th>
              <th style="padding:10px;text-align:right;color:#5C4033;font-size:12px;text-transform:uppercase;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsRows}</tbody>
        </table>

        <table style="width:100%;border:1px solid #E8D5C4;border-top:none;">
          <tr style="border-top:2px solid #FFD700;">
            <td style="padding:12px 16px;text-align:right;color:#5C4033;font-size:16px;font-weight:bold;">Order Total:</td>
            <td style="padding:12px 16px;text-align:right;color:#FFD700;font-size:18px;font-weight:bold;width:130px;">₹${Number(order.total_amount || 0).toFixed(2)}</td>
          </tr>
        </table>
      </div>
      <div style="background:#FAF6EE;padding:16px 30px;text-align:center;color:#8B6F47;font-size:11px;">
        Automated order notification from ${siteName}.
      </div>
    </div>
  </body></html>`;

  return deliver(resend, from, base44, siteName, adminEmail, subject, html);
}

// --- Main handler ---
// Invoked exactly once from Checkout.jsx AFTER the order is saved and payment
// is verified. Refreshing the My Orders page never calls this, so each order
// produces exactly one customer invoice + one admin notification.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const order_id = body.order_id;
    const requestedCustomerEmail = body.customer_email || user.email;

    if (!order_id) {
      return Response.json({ error: 'Order ID is required' }, { status: 400 });
    }

    console.log(`Processing invoices for order: ${order_id}, customer email: ${requestedCustomerEmail}`);

    // Load order
    const orders = await base44.asServiceRole.entities.Order.filter({ id: order_id });
    if (orders.length === 0) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }
    const order = orders[0];

    if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
      return Response.json({ error: 'Order has no items' }, { status: 400 });
    }

    // Load site settings & config in parallel
    const [siteSettingsList, configs] = await Promise.all([
      base44.asServiceRole.entities.SiteSettings.list(),
      base44.asServiceRole.entities.Configuration.list(),
    ]);

    const siteSettings = siteSettingsList[0] || {};
    const config = configs[0] || {};
    const siteName = siteSettings.site_name || 'Manimaran Palkova';
    const siteLogo = siteSettings.logo || null;

    // Admin email: fetched dynamically from Configuration (never hardcoded)
    const adminEmail = config.admin_email || '';
    if (!adminEmail || !EMAIL_REGEX.test(adminEmail)) {
      console.error('Admin email missing or invalid in Configuration — admin notification will be skipped.');
    } else {
      console.log(`Admin notification target (from Configuration): ${adminEmail}`);
    }

    // Respect "Enable Email Service" toggle
    const emailEnabled = config.resend_enabled !== false;
    if (!emailEnabled) {
      console.warn('Email service is DISABLED in Configuration (resend_enabled=false). No emails will be sent. Order remains created.');
      return Response.json({
        success: true,
        email_service_enabled: false,
        customer_email_sent: false,
        admin_email_sent: false,
        message: 'Email service disabled in configuration; order saved, no emails sent',
      });
    }

    // Setup Resend if API key configured (credentials from Configuration entity, never hardcoded in code)
    let resend = null;
    let resendFrom = null;
    if (config.resend_api_key) {
      resend = new Resend(config.resend_api_key);
      if (config.resend_sender_email && config.resend_sender_email.trim()) {
        resendFrom = `${config.resend_sender_name || siteName} <${config.resend_sender_email.trim()}>`;
      } else {
        // Sandbox sender — Resend only delivers to the email that owns this Resend account.
        resendFrom = `${siteName} <onboarding@resend.dev>`;
        console.warn('resend_sender_email is NOT set in Configuration — using Resend sandbox sender (onboarding@resend.dev). This ONLY delivers to the Resend account owner email. Set a verified Sender Email in Admin → Configuration to deliver to all customers.');
      }
      console.log(`Resend initialized. From: ${resendFrom}`);
    } else {
      console.warn('Resend NOT initialized — no resend_api_key in Configuration. Falling back to Base44 SendEmail (only delivers to registered app users).');
    }

    const commonArgs = { order, resend, from: resendFrom, base44, siteName, siteLogo };

    // --- Customer invoice: validate email, skip if missing/invalid, log, continue ---
    let customerResult = null;
    const validCustomerEmail = requestedCustomerEmail && EMAIL_REGEX.test(requestedCustomerEmail);
    if (!validCustomerEmail) {
      console.warn(`Customer email missing/invalid ("${requestedCustomerEmail}"); skipping customer invoice. Admin notification will still be attempted.`);
    } else {
      customerResult = await sendCustomerInvoice({ ...commonArgs, customerEmail: requestedCustomerEmail });
    }

    // --- Admin notification: send to the email from Configuration ---
    let adminResult = null;
    if (adminEmail && EMAIL_REGEX.test(adminEmail)) {
      adminResult = await sendClientOrderNotification({ ...commonArgs, customerEmail: requestedCustomerEmail, adminEmail });
    } else {
      console.error('Skipping admin notification — admin_email not configured or invalid.');
      adminResult = { to: adminEmail || '(missing)', sent: false, error: 'Admin email missing or invalid in Configuration' };
    }

    const customerSent = !!customerResult?.sent;
    const adminSent = !!adminResult?.sent;

    console.log(`Invoice processing complete. Customer sent: ${customerSent}, Admin sent: ${adminSent}`);

    return Response.json({
      success: true,
      email_service_enabled: true,
      customer_email_sent: customerSent,
      admin_email_sent: adminSent,
      customer_email: validCustomerEmail ? requestedCustomerEmail : null,
      admin_email: adminEmail || null,
      resend_sender: resendFrom,
      results: [customerResult, adminResult].filter(Boolean),
      message: 'Order saved; email notifications processed',
    });

  } catch (error) {
    // Email failure must NEVER cancel/rollback the already-saved order.
    console.error('Error in sendOrderConfirmation:', error);
    return Response.json({ error: error.message, success: false }, { status: 500 });
  }
});