import twilio from 'twilio';

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';

const PAYMENT_LABELS: Record<string, string> = {
  haf: 'HAF (Free)',
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  childcare_voucher: 'Childcare Voucher',
  childcare_grant: 'Childcare Grant',
  tax_free_childcare: 'Tax Free Childcare',
  no_payment: 'No Payment Required',
};

export async function sendBookingInviteSMS(
  phoneNumber: string,
  token: string,
  campName: string,
  locationName: string,
  paymentMethod: string,
): Promise<void> {
  if (!ACCOUNT_SID || !AUTH_TOKEN || !FROM_NUMBER) {
    console.warn('Twilio credentials not configured — skipping SMS');
    return;
  }

  const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://camps.robocode.uk';
  const bookingUrl = `${BASE}/book/invite/${token}`;
  const methodLabel = PAYMENT_LABELS[paymentMethod] || paymentMethod;
  const isHaf = paymentMethod === 'haf';

  const body = isHaf
    ? `Robocode Holiday Tech Camp\n\nYour free HAF place at ${locationName} is ready! Complete your booking (you'll need your HAF code):\n${bookingUrl}`
    : `Robocode Holiday Tech Camp\n\nYou've been invited to book at ${locationName}.\nPayment: ${methodLabel}\n\nComplete your booking here:\n${bookingUrl}`;

  const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

  const message = await client.messages.create({
    body,
    from: FROM_NUMBER,
    to: phoneNumber,
  });

  console.log(`Booking invite SMS sent to ${phoneNumber} (SID: ${message.sid})`);
}
