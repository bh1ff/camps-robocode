const TENANT_ID = process.env.AZURE_TENANT_ID || '';
const CLIENT_ID = process.env.AZURE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET || '';
const SENDER = 'noreply@robocode.uk';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getGraphToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const url = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.token;
}

interface BookingChild {
  firstName: string;
  lastName: string;
  dayBookings: { campDay: { date: Date | string; dayLabel: string } }[];
}

interface BookingForEmail {
  id: string;
  type: string;
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  totalAmount: number;
  children: BookingChild[];
  camp: {
    name: string;
    location?: { name: string; address: string } | null;
  };
}

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/London',
  });
}

function buildConfirmationHtml(booking: BookingForEmail): string {
  const locationName = booking.camp.location?.name || booking.camp.name;
  const address = booking.camp.location?.address || '';
  const bookingRef = booking.id.slice(0, 8).toUpperCase();
  const isHaf = booking.type === 'haf';

  const allDays = booking.children
    .flatMap((c) => c.dayBookings.map((db) => db.campDay))
    .filter((d, i, arr) => arr.findIndex((x) => formatDate(x.date) === formatDate(d.date)) === i)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const childrenList = booking.children
    .map((c) => {
      const days = c.dayBookings
        .map((db) => db.campDay)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((d) => formatDate(d.date))
        .join(', ');
      return `<li style="margin-bottom:4px"><strong>${c.firstName} ${c.lastName}</strong> — ${c.dayBookings.length} day${c.dayBookings.length !== 1 ? 's' : ''} (${days})</li>`;
    })
    .join('');

  const daysList = allDays
    .map((d) => `<li style="margin-bottom:2px">${formatDate(d.date)}</li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f9f9;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f9f9;padding:32px 16px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,52,57,0.08)">

  <!-- Header -->
  <tr><td style="background:#003439;padding:32px 40px;text-align:center">
    <h1 style="margin:0;color:#00dcde;font-size:28px;letter-spacing:1px">ROBOCODE</h1>
    <p style="margin:4px 0 0;color:#83fdff;font-size:13px;letter-spacing:2px">HOLIDAY TECH CAMP</p>
  </td></tr>

  <!-- Success banner -->
  <tr><td style="background:linear-gradient(135deg,#edfffe,#fff0fd);padding:28px 40px;text-align:center">
    <div style="width:56px;height:56px;margin:0 auto 12px;background:#00dcde;border-radius:50%;line-height:56px;font-size:28px;color:#fff">&#10003;</div>
    <h2 style="margin:0;color:#003439;font-size:22px">Booking Confirmed!</h2>
    <p style="margin:8px 0 0;color:#05575c;font-size:14px">Thank you, ${booking.parentFirstName}. ${isHaf ? 'Your free place has been secured.' : 'Your payment has been received.'}</p>
  </td></tr>

  <!-- Details -->
  <tr><td style="padding:28px 40px">
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#05575c">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:bold;color:#003439;width:140px">Booking Ref</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee">${bookingRef}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:bold;color:#003439">Location</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee">${locationName}${address ? `<br><span style="color:#05575c99;font-size:12px">${address}</span>` : ''}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:bold;color:#003439">Session Times</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee">10:00 AM – 2:00 PM</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:bold;color:#003439">${isHaf ? 'Cost' : 'Amount Paid'}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:bold;color:#ff00bf">${isHaf ? 'Free (HAF Funded)' : `£${booking.totalAmount.toFixed(2)}`}</td>
      </tr>
    </table>
  </td></tr>

  <!-- Children -->
  <tr><td style="padding:0 40px 20px">
    <h3 style="margin:0 0 8px;color:#003439;font-size:15px">Children</h3>
    <ul style="margin:0;padding-left:20px;font-size:14px;color:#05575c">${childrenList}</ul>
  </td></tr>

  <!-- Days -->
  <tr><td style="padding:0 40px 28px">
    <h3 style="margin:0 0 8px;color:#003439;font-size:15px">Booked Days</h3>
    <ul style="margin:0;padding-left:20px;font-size:14px;color:#05575c">${daysList}</ul>
  </td></tr>

  <!-- What to bring -->
  <tr><td style="padding:0 40px 28px">
    <div style="background:#edfffe;border-radius:12px;padding:20px">
      <h3 style="margin:0 0 8px;color:#003439;font-size:15px">What to Bring</h3>
      <ul style="margin:0;padding-left:20px;font-size:13px;color:#05575c">
        <li style="margin-bottom:4px">A packed lunch and water bottle</li>
        <li style="margin-bottom:4px">Comfortable clothing</li>
        <li style="margin-bottom:4px">Any required medication</li>
      </ul>
    </div>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#003439;padding:24px 40px;text-align:center">
    <p style="margin:0 0 4px;color:#83fdff;font-size:13px">Questions? Get in touch:</p>
    <p style="margin:0;color:#ffffff;font-size:13px">
      <a href="mailto:info@robocode.uk" style="color:#00dcde;text-decoration:none">info@robocode.uk</a>
      &nbsp;|&nbsp; <a href="tel:01217691642" style="color:#00dcde;text-decoration:none">0121 769 1642</a>
    </p>
    <p style="margin:12px 0 0;color:#05575c;font-size:11px">&copy; ${new Date().getFullYear()} Robocode UK Limited. All rights reserved.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function sendConfirmationEmail(booking: BookingForEmail): Promise<void> {
  if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET) {
    console.warn('Azure Graph API credentials not configured — skipping confirmation email');
    return;
  }

  const token = await getGraphToken();
  const url = `https://graph.microsoft.com/v1.0/users/${SENDER}/sendMail`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        subject: `Booking Confirmed — Robocode Holiday Tech Camp${booking.type === 'haf' ? ' (HAF)' : ''} (${booking.id.slice(0, 8).toUpperCase()})`,
        body: {
          contentType: 'HTML',
          content: buildConfirmationHtml(booking),
        },
        toRecipients: [
          { emailAddress: { address: booking.parentEmail } },
        ],
      },
      saveToSentItems: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Graph sendMail failed (${res.status}): ${text}`);
  }

  console.log(`Confirmation email sent to ${booking.parentEmail} for booking ${booking.id.slice(0, 8).toUpperCase()}`);
}
