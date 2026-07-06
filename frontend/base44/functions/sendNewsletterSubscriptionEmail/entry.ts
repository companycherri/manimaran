import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { subscriberEmail } = await req.json();

    if (!subscriberEmail) {
      return Response.json({ error: 'Subscriber email is required' }, { status: 400 });
    }

    // Get admin email from configuration
    const config = await base44.asServiceRole.entities.Configuration.list();
    const adminEmail = config.length > 0 && config[0].admin_email 
      ? config[0].admin_email 
      : 'contentcherri@gmail.com';

    // Get site settings for branding
    const settings = await base44.asServiceRole.entities.SiteSettings.list();
    const siteName = settings.length > 0 && settings[0].site_name 
      ? settings[0].site_name 
      : 'Manimaran Palkova';

    // Send email to subscriber
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: subscriberEmail,
      subject: `Welcome to ${siteName} Newsletter!`,
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #5C4033;">Thank You for Subscribing!</h2>
          <p>Welcome to the ${siteName} family!</p>
          <p>You'll now receive updates about:</p>
          <ul>
            <li>New product arrivals</li>
            <li>Special offers and discounts</li>
            <li>Festival special collections</li>
            <li>Exclusive deals for subscribers</li>
          </ul>
          <p style="margin-top: 20px;">We're excited to keep you updated with the best of traditional Indian sweets.</p>
          <p style="color: #8B6F47; margin-top: 30px;">Best regards,<br>${siteName} Team</p>
        </div>
      `
    });

    // Send notification to admin
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: adminEmail,
      subject: 'New Newsletter Subscription',
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #5C4033;">New Newsletter Subscriber</h2>
          <p>A new user has subscribed to your newsletter:</p>
          <p style="background: #FFF8E7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>Email:</strong> ${subscriberEmail}<br>
            <strong>Subscribed on:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
          </p>
          <p style="color: #8B6F47;">This is an automated notification from your website.</p>
        </div>
      `
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending newsletter emails:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});