// backend/src/services/sms/arkesel.js
// In development (NODE_ENV !== 'production' or no API key), the message is
// printed to the console instead of being sent.  This saves SMS credit during
// development and means the whole flow can be tested without a real phone.

export async function sendSms(phone, message) {
  if (!process.env.ARKESEL_API_KEY) {
    console.log(`\n[SMS] To: ${phone}\n[SMS] Body: ${message}\n`);
    return { ok: true, dev: true };
  }

  const response = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.ARKESEL_API_KEY,
    },
    body: JSON.stringify({
      sender:     'FraudShield',
      message,
      recipients: [phone],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Arkesel send failed: ${response.status} ${body}`);
  }
  return response.json();
}
