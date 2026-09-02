const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
export const twilioNumber = process.env.TWILIO_PHONE_NUMBER || '+15551234567';

// If Twilio credentials are provided, we can dynamically dispatch or use REST fetch
export async function sendTwilioSms(to: string, body: string, statusCallbackUrl?: string) {
  if (!accountSid || !authToken) {
    console.log(`[Twilio DRY-RUN] To: ${to} - Body: "${body}"`);
    return { status: 'dry_run' as const, sid: `mock-sms-${Date.now()}` };
  }

  try {
    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const formData = new URLSearchParams();
    formData.append('To', to);
    formData.append('From', twilioNumber);
    formData.append('Body', body);
    if (statusCallbackUrl) {
      formData.append('StatusCallback', statusCallbackUrl);
    }

    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || `Twilio returned ${response.status}`);
    }

    return { status: 'sent' as const, sid: result.sid };
  } catch (err: any) {
    console.error('Twilio SMS error:', err);
    return { status: 'dry_run' as const, sid: null, error: err.message };
  }
}
