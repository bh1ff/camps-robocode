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
    <img src="https://camps.robocode.uk/logo-light.png" alt="Robocode" width="200" style="display:block;margin:0 auto;max-width:200px;height:auto" />
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
    <p style="margin:12px 0 0;color:#05575c;font-size:11px">&copy; ${new Date().getFullYear()} RobocodeUK Limited. All rights reserved.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function buildWelcomeHtml(subscriberEmail: string): string {
  const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://camps.robocode.uk';
  const year = new Date().getFullYear();
  const unsubUrl = `${BASE}/api/unsubscribe?email=${encodeURIComponent(subscriberEmail)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f9f9;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f9f9;padding:32px 16px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,52,57,0.08)">

  <!-- Header -->
  <tr><td style="background:#003439;padding:32px 40px;text-align:center">
    <img src="${BASE}/logo-light.png" alt="Robocode" width="200" style="display:block;margin:0 auto;max-width:200px;height:auto" />
  </td></tr>

  <!-- Hero image -->
  <tr><td style="padding:0;line-height:0">
    <img src="${BASE}/camp/hero-teacher-drone-demo.jpg" alt="Robocode Holiday Tech Camp" width="600" style="display:block;width:100%;height:auto" />
  </td></tr>

  <!-- Welcome message -->
  <tr><td style="padding:32px 40px;text-align:center">
    <h1 style="margin:0 0 8px;color:#003439;font-size:26px;font-weight:800">You&rsquo;re on the list!</h1>
    <p style="margin:0 0 20px;color:#05575c;font-size:15px;line-height:1.6">
      Thank you for joining the Robocode community. We&rsquo;ll be the first to let you know when our next <strong>Holiday Tech Camp</strong> opens for bookings.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>
      <td style="background:#00dcde;border-radius:50px;padding:14px 32px">
        <a href="${BASE}" style="color:#003439;font-weight:800;font-size:14px;text-decoration:none;letter-spacing:0.5px">VIEW UPCOMING CAMPS</a>
      </td>
    </tr></table>
  </td></tr>

  <!-- Divider -->
  <tr><td style="padding:0 40px"><div style="border-top:1px solid #edf2f2"></div></td></tr>

  <!-- What we do -->
  <tr><td style="padding:28px 40px">
    <h2 style="margin:0 0 6px;color:#003439;font-size:18px">More than a holiday camp</h2>
    <p style="margin:0 0 20px;color:#05575c;font-size:14px;line-height:1.6">
      Robocode runs <strong>year-round technology education</strong> across robotics, coding, electronics, and 3D printing for ages 6&ndash;17. Our holiday camps are just one part of what we do.
    </p>
  </td></tr>

  <!-- Activity grid -->
  <tr><td style="padding:0 40px 28px">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="48%" style="padding-right:8px;vertical-align:top">
          <img src="${BASE}/camp/activity-robotics-new.jpg" alt="Robotics" width="260" style="display:block;width:100%;height:auto;border-radius:10px" />
          <p style="margin:8px 0 16px;color:#003439;font-size:13px;font-weight:700">Robotics &amp; Engineering</p>
        </td>
        <td width="48%" style="padding-left:8px;vertical-align:top">
          <img src="${BASE}/camp/activity-3d-printing.jpg" alt="3D Printing" width="260" style="display:block;width:100%;height:auto;border-radius:10px" />
          <p style="margin:8px 0 16px;color:#003439;font-size:13px;font-weight:700">3D Printing &amp; Design</p>
        </td>
      </tr>
      <tr>
        <td width="48%" style="padding-right:8px;vertical-align:top">
          <img src="${BASE}/camp/activity-game-dev-desktop.jpg" alt="Game Development" width="260" style="display:block;width:100%;height:auto;border-radius:10px" />
          <p style="margin:8px 0 16px;color:#003439;font-size:13px;font-weight:700">Game Development</p>
        </td>
        <td width="48%" style="padding-left:8px;vertical-align:top">
          <img src="${BASE}/camp/activity-electronics.jpg" alt="Electronics" width="260" style="display:block;width:100%;height:auto;border-radius:10px" />
          <p style="margin:8px 0 16px;color:#003439;font-size:13px;font-weight:700">Electronics &amp; Arduino</p>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Regular courses CTA -->
  <tr><td style="padding:0 40px 28px">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#edfffe,#fff0fd);border-radius:12px;overflow:hidden">
      <tr><td style="padding:24px 28px">
        <h3 style="margin:0 0 6px;color:#003439;font-size:16px;font-weight:800">Did you know?</h3>
        <p style="margin:0 0 16px;color:#05575c;font-size:13px;line-height:1.6">
          We also run <strong>regular weekly courses, workshops, and after-school clubs</strong> throughout the year. Give your child a head start in technology with hands-on, project-based learning every week.
        </p>
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="background:#ff00bf;border-radius:50px;padding:12px 28px">
            <a href="https://www.robocode.uk" style="color:#ffffff;font-weight:800;font-size:13px;text-decoration:none;letter-spacing:0.5px">EXPLORE REGULAR COURSES &rarr;</a>
          </td>
        </tr></table>
      </td></tr>
    </table>
  </td></tr>

  <!-- Stats bar -->
  <tr><td style="padding:0 40px 28px">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#003439;border-radius:12px;overflow:hidden">
      <tr>
        <td width="33%" style="padding:20px 0;text-align:center;border-right:1px solid rgba(255,255,255,0.1)">
          <div style="color:#00dcde;font-size:22px;font-weight:800">22,000+</div>
          <div style="color:#ffffff;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-top:4px">Students</div>
        </td>
        <td width="34%" style="padding:20px 0;text-align:center;border-right:1px solid rgba(255,255,255,0.1)">
          <div style="color:#00dcde;font-size:22px;font-weight:800">Ofsted</div>
          <div style="color:#ffffff;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-top:4px">Registered</div>
        </td>
        <td width="33%" style="padding:20px 0;text-align:center">
          <div style="color:#00dcde;font-size:22px;font-weight:800">FTC</div>
          <div style="color:#ffffff;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-top:4px">Champions</div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Accreditations -->
  <tr><td style="padding:0 40px 28px;text-align:center">
    <p style="margin:0 0 12px;color:#05575c;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px">Accredited &amp; Recognised By</p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto">
      <tr>
        <td style="padding:0 8px"><img src="${BASE}/logos/ofsted.png" alt="Ofsted" height="32" style="height:32px;width:auto" /></td>
        <td style="padding:0 8px"><img src="${BASE}/logos/microsoft-education.png" alt="Microsoft" height="32" style="height:32px;width:auto" /></td>
        <td style="padding:0 8px"><img src="${BASE}/logos/bcs.png" alt="BCS" height="32" style="height:32px;width:auto" /></td>
        <td style="padding:0 8px"><img src="${BASE}/logos/first-tech-challenge.png" alt="FTC" height="32" style="height:32px;width:auto" /></td>
        <td style="padding:0 8px"><img src="${BASE}/logos/matrix.png" alt="Matrix" height="32" style="height:32px;width:auto" /></td>
      </tr>
    </table>
  </td></tr>

  <!-- Social media -->
  <tr><td style="padding:0 40px 28px;text-align:center">
    <p style="margin:0 0 14px;color:#05575c;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px">Follow Us</p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto">
      <tr>
        <td style="padding:0 6px"><a href="https://www.instagram.com/Robocode_Official" style="color:#003439;text-decoration:none;font-size:12px;font-weight:700;background:#edfffe;border-radius:8px;padding:8px 14px;display:inline-block">Instagram</a></td>
        <td style="padding:0 6px"><a href="https://www.facebook.com/RobocodeOfficial" style="color:#003439;text-decoration:none;font-size:12px;font-weight:700;background:#edfffe;border-radius:8px;padding:8px 14px;display:inline-block">Facebook</a></td>
        <td style="padding:0 6px"><a href="https://www.tiktok.com/@robocode_official" style="color:#003439;text-decoration:none;font-size:12px;font-weight:700;background:#edfffe;border-radius:8px;padding:8px 14px;display:inline-block">TikTok</a></td>
        <td style="padding:0 6px"><a href="https://www.youtube.com/@robocode_official" style="color:#003439;text-decoration:none;font-size:12px;font-weight:700;background:#edfffe;border-radius:8px;padding:8px 14px;display:inline-block">YouTube</a></td>
      </tr>
    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#003439;padding:28px 40px;text-align:center">
    <img src="${BASE}/logo-light.png" alt="Robocode" width="120" style="display:block;margin:0 auto 16px;max-width:120px;height:auto;opacity:0.7" />
    <p style="margin:0 0 8px;color:#83fdff;font-size:12px;font-weight:600">Stay connected</p>
    <p style="margin:0 0 16px;color:#ffffff;font-size:13px">
      <a href="https://www.robocode.uk" style="color:#00dcde;text-decoration:none;font-weight:700">www.robocode.uk</a>
    </p>
    <p style="margin:0 0 8px;color:#ffffff;font-size:12px">
      <a href="mailto:info@robocode.uk" style="color:#00dcde;text-decoration:none">info@robocode.uk</a>
      &nbsp;&bull;&nbsp;
      <a href="tel:01216619222" style="color:#00dcde;text-decoration:none">0121 661 9222</a>
    </p>
    <div style="margin:16px 0 0;padding-top:16px;border-top:1px solid rgba(255,255,255,0.1)">
      <p style="margin:0;color:#05575c;font-size:10px">&copy; ${year} RobocodeUK Limited. Company No. 14161031. All rights reserved.</p>
      <p style="margin:6px 0 0;color:#05575c;font-size:10px">The Exchange, 26 Haslucks Green Rd, Shirley, Solihull, B90 2EL</p>
      <p style="margin:10px 0 0"><a href="${unsubUrl}" style="color:#05575c;font-size:9px;text-decoration:none">Unsubscribe</a></p>
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function sendWelcomeEmail(toEmail: string): Promise<void> {
  if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET) {
    console.warn('Azure Graph API credentials not configured — skipping welcome email');
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
        subject: "You're on the list! — Robocode Holiday Tech Camps",
        body: {
          contentType: 'HTML',
          content: buildWelcomeHtml(toEmail),
        },
        toRecipients: [
          { emailAddress: { address: toEmail } },
        ],
      },
      saveToSentItems: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Graph sendMail failed (${res.status}): ${text}`);
  }

  console.log(`Welcome email sent to ${toEmail}`);
}

export async function addToSubscriberList(email: string, source = 'booking'): Promise<void> {
  const normalised = email.trim().toLowerCase();

  try {
    const { default: db } = await import('@/lib/db');
    await db.subscriber.upsert({
      where: { email: normalised },
      update: {},
      create: { email: normalised, source },
    });
  } catch (err) {
    console.error('Local subscriber save failed:', err);
  }

  if (process.env.MAILCHIMP_API_KEY && process.env.MAILCHIMP_LIST_ID) {
    const dc = process.env.MAILCHIMP_API_KEY.split('-').pop();
    try {
      await fetch(
        `https://${dc}.api.mailchimp.com/3.0/lists/${process.env.MAILCHIMP_LIST_ID}/members`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `apikey ${process.env.MAILCHIMP_API_KEY}`,
          },
          body: JSON.stringify({
            email_address: normalised,
            status: 'subscribed',
            tags: ['camps-booking'],
          }),
        }
      );
    } catch { /* already subscribed or error — ignore */ }
  }

  console.log(`Subscriber added: ${normalised} (source: ${source})`);
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

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  haf: 'HAF (Free)',
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  childcare_voucher: 'Childcare Voucher',
  childcare_grant: 'Childcare Grant',
  tax_free_childcare: 'Tax Free Childcare',
  no_payment: 'No Payment Required',
};

export async function sendBookingInviteEmail(
  toEmail: string,
  token: string,
  campName: string,
  locationName: string,
  paymentMethod: string,
): Promise<void> {
  if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET) {
    console.warn('Azure Graph API credentials not configured — skipping invite email');
    return;
  }

  const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://camps.robocode.uk';
  const bookingUrl = `${BASE}/book/invite/${token}`;
  const methodLabel = PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod;
  const isHaf = paymentMethod === 'haf';
  const headline = isHaf ? 'Your Free HAF Place is Ready!' : 'You\'re Invited to Book!';
  const subtitle = isHaf
    ? 'A free HAF-funded place has been reserved for your child at Robocode Holiday Tech Camp. Complete the form using the link below — you\'ll need your HAF code.'
    : 'A place has been reserved for you at Robocode Holiday Tech Camp. Complete your booking using the link below.';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="margin:0;padding:0;background:#f0f7f7;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7f7;padding:32px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,52,57,0.08)">

  <tr><td style="background:#003439;padding:32px 24px;text-align:center">
    <img src="${BASE}/logo-light.png" alt="Robocode" width="180" style="display:block;margin:0 auto;max-width:180px;height:auto" />
  </td></tr>

  <tr><td style="padding:40px 32px 24px;text-align:center">
    <h1 style="margin:0 0 8px;font-size:24px;color:#003439;font-weight:800">${headline}</h1>
    <p style="margin:0;font-size:14px;color:#05575c;opacity:0.7;line-height:1.6">
      ${subtitle}
    </p>
  </td></tr>

  <tr><td style="padding:0 32px 24px">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7f7;border-radius:12px;padding:20px">
      <tr><td style="padding:8px 20px;font-size:13px;color:#05575c">
        <strong style="color:#003439">Location:</strong> ${locationName}
      </td></tr>
      <tr><td style="padding:8px 20px;font-size:13px;color:#05575c">
        <strong style="color:#003439">Camp:</strong> ${campName}
      </td></tr>
      <tr><td style="padding:8px 20px;font-size:13px;color:#05575c">
        <strong style="color:#003439">${isHaf ? 'Type:' : 'Payment Method:'}</strong> ${methodLabel}
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:0 32px 32px;text-align:center">
    <a href="${bookingUrl}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#00adb3,#00d4db);color:#003439;font-size:16px;font-weight:800;text-decoration:none;border-radius:50px;letter-spacing:0.5px">
      COMPLETE YOUR BOOKING
    </a>
    <p style="margin:16px 0 0;font-size:11px;color:#05575c;opacity:0.4">
      This is a one-time link. It will expire after you submit your booking.
    </p>
  </td></tr>

  <tr><td style="background:#f8fafa;padding:24px 32px;text-align:center;border-top:1px solid #e5ebed">
    <img src="${BASE}/logo-light.png" alt="Robocode" width="100" style="display:block;margin:0 auto 12px;max-width:100px;height:auto;opacity:0.5" />
    <p style="margin:0;font-size:11px;color:#05575c;opacity:0.4;line-height:1.5">
      Robocode Holiday Tech Camp<br/>
      Robotics, coding, 3D printing and more for ages 6&ndash;17
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;

  const graphToken = await getGraphToken();
  const url = `https://graph.microsoft.com/v1.0/users/${SENDER}/sendMail`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        subject: isHaf
          ? `Your Free HAF Place — Robocode Holiday Tech Camp`
          : `Complete Your Booking — Robocode Holiday Tech Camp`,
        body: { contentType: 'HTML', content: html },
        toRecipients: [{ emailAddress: { address: toEmail } }],
      },
      saveToSentItems: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Graph sendMail failed (${res.status}): ${text}`);
  }

  console.log(`Booking invite email sent to ${toEmail}`);
}
