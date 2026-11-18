import { Resend } from 'resend';

const getMailerForTenant = (ownerSlug) => {
  let apiKey, ownerEmail;

  if (ownerSlug === 'saker') {
    apiKey = process.env.RESEND_API_KEY_SAKER;
    ownerEmail = process.env.OWNER_EMAIL_SAKER;
  } else if (ownerSlug === 'sumaiya') {
    apiKey = process.env.RESEND_API_KEY_SUMAIYA;
    ownerEmail = process.env.OWNER_EMAIL_SUMAIYA;
  }

  // Fallback to general settings if tenant-specific is missing
  apiKey = apiKey || process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  if (!apiKey) {
    console.warn(`[Mailer] No Resend API key configured for ${ownerSlug || 'default'}`);
    return {
      sendInquiry: async (data) => {
        console.log(`[Mailer] Simulated inquiry for ${ownerSlug || 'default'}:`, data);
        return { success: true };
      },
    };
  }

  const resend = new Resend(apiKey);
  return {
    sendInquiry: async (lead) => {
      try {
        return await resend.emails.send({
          from: fromEmail,
          to: ownerEmail || process.env.OWNER_EMAIL_SAKER,
          reply_to: lead.email,
          subject: `New Inquiry: ${lead.name}`,
          html: `
            <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px;">
              <h2 style="color: #333;">New Inquiry Received</h2>
              <p><strong>Inquiry ID:</strong> #INQ-${lead._id.toString().slice(-6)}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Portfolio:</strong> ${ownerSlug === 'sumaiya' ? 'Sumaiya' : 'Saker'}</p>
              <hr style="border: 0; border-top: 1px solid #eee;" />
              <p><strong>Client Name:</strong> ${lead.name}</p>
              <p><strong>Client Email:</strong> <a href="mailto:${lead.email}">${lead.email}</a></p>
              <p><strong>Subject/Service:</strong> ${lead.projectType || 'General Inquiry'}</p>
              <p><strong>Message:</strong></p>
              <p style="background: #f9f9f9; padding: 15px; border-radius: 5px;">${lead.message || 'No message provided.'}</p>
            </div>
          `,
        });
      } catch (error) {
        console.error(`[Mailer] Error sending inquiry via ${ownerSlug}:`, error);
        throw error;
      }
    },
  };
};

export { getMailerForTenant };
