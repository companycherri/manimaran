import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { name, email, subject, message, whatsapp_number } = await req.json();

    if (!name || !email || !subject || !message) {
      return Response.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Send email notification
    await base44.integrations.Core.SendEmail({
      to: 'contentcherri@gmail.com',
      subject: `Contact Form: ${subject}`,
      body: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    });

    // Send WhatsApp notification to admin in the background (no user redirect)
    if (whatsapp_number) {
      const waText = encodeURIComponent(
        `📩 *New Contact Form Submission*\n\n` +
        `👤 *Name:* ${name}\n` +
        `📧 *Email:* ${email}\n` +
        `📌 *Subject:* ${subject}\n` +
        `💬 *Message:*\n${message}`
      );
      const waUrl = `https://api.whatsapp.com/send?phone=${whatsapp_number}&text=${waText}`;
      // Fire-and-forget — we don't await or care about the response
      fetch(waUrl).catch(() => {});
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});