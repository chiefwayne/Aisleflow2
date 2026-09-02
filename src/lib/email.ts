interface SendEmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.COMMUNICATION_FROM_EMAIL || 'AisleFlow <invitations@aisleflow.local>';

  if (!apiKey) {
    console.log(`[Email DRY-RUN] To: ${to} - Subject: "${subject}" - Body: "${text}"`);
    return { status: 'dry_run' as const, providerMessageId: `mock-email-${Date.now()}` };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text,
        html: html || text.replace(/\n/g, '<br />'),
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = typeof result?.message === 'string' ? result.message : `Email provider returned ${response.status}`;
      throw new Error(message);
    }

    return {
      status: 'sent' as const,
      providerMessageId: typeof result?.id === 'string' ? result.id : null,
    };
  } catch (err: any) {
    console.error('Resend email error:', err);
    return { status: 'dry_run' as const, providerMessageId: null, error: err.message };
  }
}
