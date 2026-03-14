import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM_EMAIL = "Truss <crew@trusswork.org>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://trusswork.org";

function baseTemplate(content: string, preheader: string = "") {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background: #0A0A0F; color: #E8E6E3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .container { max-width: 520px; margin: 0 auto; padding: 40px 24px; }
    .logo { text-align: center; margin-bottom: 32px; }
    .logo span { font-size: 14px; font-weight: 800; letter-spacing: 4px; color: #E8E6E3; }
    .card { background: #12121A; border: 1px solid rgba(255,255,255,0.04); border-radius: 12px; padding: 28px; margin-bottom: 16px; }
    .card h2 { margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #E8E6E3; }
    .card p { margin: 0; font-size: 14px; color: #8A8A8A; line-height: 1.7; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.03); }
    .detail-label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
    .detail-value { font-size: 14px; color: #E8E6E3; font-weight: 500; }
    .btn { display: inline-block; padding: 14px 32px; background: #FF4D00; color: #fff !important; text-decoration: none; font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; border-radius: 10px; margin-top: 16px; }
    .btn-outline { display: inline-block; padding: 12px 28px; background: transparent; color: #E8E6E3 !important; text-decoration: none; font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); margin-top: 8px; }
    .footer { text-align: center; padding-top: 24px; }
    .footer p { font-size: 11px; color: #444; }
    .footer a { color: #FF4D00; text-decoration: none; }
    .highlight { color: #FF4D00; }
    .amount { font-size: 28px; font-weight: 700; color: #FF4D00; }
    .preheader { display: none; max-height: 0; overflow: hidden; }
  </style>
</head>
<body>
  <div class="preheader">${preheader}</div>
  <div class="container">
    <div class="logo">
      <span>▲ TRUSS</span>
    </div>
    ${content}
    <div class="footer">
      <p><a href="${SITE_URL}">trusswork.org</a> · The backbone of every show</p>
      <p style="margin-top:8px;">You're receiving this because you have a Truss account.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendBookingRequestEmail(
  toEmail: string,
  techName: string,
  producerName: string,
  projectName: string,
  rate: number,
  hours: number,
  total: number
) {
  const html = baseTemplate(`
    <div class="card">
      <h2>New Booking Request</h2>
      <p><strong>${producerName}</strong> wants to book you for <strong class="highlight">${projectName}</strong></p>
    </div>
    <div class="card">
      <div class="detail-row">
        <span class="detail-label">Rate</span>
        <span class="detail-value">$${rate}/hr</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Hours</span>
        <span class="detail-value">${hours}hr</span>
      </div>
      <div class="detail-row" style="border:none;">
        <span class="detail-label">Total</span>
        <span class="detail-value amount">$${total.toLocaleString()}</span>
      </div>
    </div>
    <div style="text-align:center;">
      <a href="${SITE_URL}/bookings" class="btn">View & Respond</a>
    </div>
  `, `${producerName} wants to book you for ${projectName} — $${total}`);

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: `New booking request from ${producerName}`,
    html,
  });
}

export async function sendBookingAcceptedEmail(
  toEmail: string,
  producerName: string,
  techName: string,
  projectName: string,
  total: number
) {
  const html = baseTemplate(`
    <div class="card">
      <h2>Booking Accepted</h2>
      <p><strong class="highlight">${techName}</strong> accepted your booking for <strong>${projectName}</strong></p>
      <p style="margin-top:12px;">Total: <span class="amount">$${total.toLocaleString()}</span></p>
    </div>
    <div style="text-align:center;">
      <a href="${SITE_URL}/bookings" class="btn">Confirm & Pay</a>
      <br>
      <a href="${SITE_URL}/messages" class="btn-outline">Message ${techName}</a>
    </div>
  `, `${techName} accepted your booking for ${projectName}`);

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: `${techName} accepted your booking!`,
    html,
  });
}

export async function sendBookingConfirmedEmail(
  toEmail: string,
  techName: string,
  producerName: string,
  projectName: string,
  total: number
) {
  const html = baseTemplate(`
    <div class="card">
      <h2>Booking Confirmed</h2>
      <p><strong>${producerName}</strong> confirmed your booking for <strong class="highlight">${projectName}</strong></p>
      <p style="margin-top:12px;">You're locked in for <span class="amount">$${total.toLocaleString()}</span></p>
    </div>
    <div style="text-align:center;">
      <a href="${SITE_URL}/bookings" class="btn">View Booking</a>
    </div>
  `, `Confirmed! You're booked for ${projectName}`);

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: `Booking confirmed for ${projectName}`,
    html,
  });
}

export async function sendBookingDeclinedEmail(
  toEmail: string,
  producerName: string,
  techName: string,
  projectName: string
) {
  const html = baseTemplate(`
    <div class="card">
      <h2>Booking Update</h2>
      <p><strong>${techName}</strong> is unable to take the booking for <strong>${projectName}</strong> at this time.</p>
      <p style="margin-top:12px; color: #666;">Don't worry — there are plenty of great techs available on Truss.</p>
    </div>
    <div style="text-align:center;">
      <a href="${SITE_URL}/browse" class="btn">Find Another Tech</a>
    </div>
  `, `${techName} declined your booking for ${projectName}`);

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: `Booking update for ${projectName}`,
    html,
  });
}

export async function sendGigCompletedEmail(
  toEmail: string,
  techName: string,
  producerName: string,
  projectName: string,
  total: number
) {
  const html = baseTemplate(`
    <div class="card">
      <h2>Gig Complete!</h2>
      <p><strong>${producerName}</strong> marked your gig for <strong class="highlight">${projectName}</strong> as complete.</p>
      <p style="margin-top:12px;">You earned <span class="amount">$${total.toLocaleString()}</span></p>
    </div>
    <div style="text-align:center;">
      <a href="${SITE_URL}/dashboard" class="btn">View Dashboard</a>
    </div>
  `, `Gig complete! You earned $${total} for ${projectName}`);

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: `Gig complete — $${total.toLocaleString()} earned!`,
    html,
  });
}

export async function sendReviewReceivedEmail(
  toEmail: string,
  techName: string,
  producerName: string,
  rating: number
) {
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
  const html = baseTemplate(`
    <div class="card">
      <h2>New Review</h2>
      <p><strong>${producerName}</strong> left you a review</p>
      <p style="margin-top:12px; font-size: 24px; color: #FFB300;">${stars}</p>
      <p style="margin-top:4px; color: #666;">${rating}/5 stars</p>
    </div>
    <div style="text-align:center;">
      <a href="${SITE_URL}/dashboard" class="btn">View Your Profile</a>
    </div>
  `, `${producerName} gave you ${rating} stars!`);

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: `New ${rating}★ review from ${producerName}`,
    html,
  });
}

export async function sendLevelUpEmail(
  toEmail: string,
  techName: string,
  newLevel: string,
  levelNumber: number
) {
  const html = baseTemplate(`
    <div class="card" style="text-align:center;">
      <h2 style="font-size:32px; margin-bottom:16px;"></h2>
      <h2>New Tier Unlocked!</h2>
      <p style="font-size:18px; color: #E8E6E3; margin-top:8px;">You've reached <strong class="highlight">${newLevel}</strong> status</p>
      <p style="margin-top:12px;">This tier is visible on your profile and helps producers find top talent. Keep completing gigs and earning reviews to climb higher.</p>
    </div>
    <div style="text-align:center;">
      <a href="${SITE_URL}/dashboard" class="btn">View Dashboard</a>
    </div>
  `, `You've reached ${newLevel} status!`);

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: `You've reached ${newLevel} status on Truss`,
    html,
  });
}

// ── Onboarding sequence ──────────────────────────────────────────

export async function sendProfileLiveEmail(
  toEmail: string,
  displayName: string,
  userId: string,
  userType: "tech" | "producer"
) {
  const profileUrl = userType === "tech" ? `${SITE_URL}/profile/${userId}` : `${SITE_URL}/browse`;
  const html = baseTemplate(`
    <div class="card" style="text-align:center;">
      <h2>Your Profile is Live</h2>
      <p>Welcome to Truss, <strong>${displayName}</strong>!</p>
      <p style="margin-top:12px;">
        ${userType === "tech"
          ? "Producers can now find and book you for events. Make sure your profile photo is set — profiles with photos get <strong class=\"highlight\">3x more views</strong>."
          : "You can now browse and book AV technicians for your events. Start building your crew today."}
      </p>
    </div>
    <div style="text-align:center;">
      <a href="${profileUrl}" class="btn">${userType === "tech" ? "View Your Profile" : "Browse Techs"}</a>
      ${userType === "tech" ? `<br><a href="${SITE_URL}/edit-profile" class="btn-outline">Complete Your Profile</a>` : ""}
    </div>
  `, `Welcome to Truss, ${displayName}! Your profile is live.`);

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: `Welcome to Truss — your profile is live`,
    html,
  });
}

export async function sendCompleteProfileEmail(
  toEmail: string,
  displayName: string,
  userId: string,
  missingItems: string[]
) {
  const itemsHtml = missingItems.map(item =>
    `<div style="padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.03); font-size:13px; color:#8A8A8A;">☐ ${item}</div>`
  ).join("");

  const html = baseTemplate(`
    <div class="card">
      <h2>Complete Your Profile</h2>
      <p>Hey <strong>${displayName}</strong>, profiles that are 100% complete get <strong class="highlight">3x more views</strong> from producers.</p>
      <p style="margin-top:12px;">Here's what's still missing:</p>
      <div style="margin-top:12px;">
        ${itemsHtml}
      </div>
    </div>
    <div style="text-align:center;">
      <a href="${SITE_URL}/edit-profile" class="btn">Complete Profile</a>
    </div>
  `, `${displayName}, complete your Truss profile to get more bookings`);

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: `Complete your profile to get more bookings`,
    html,
  });
}

export async function sendRateGuideEmail(
  toEmail: string,
  displayName: string,
  primarySkill: string | null
) {
  const html = baseTemplate(`
    <div class="card">
      <h2>Know Your Worth</h2>
      <p>Hey <strong>${displayName}</strong>, whether you're just starting out or you've been in the industry for years, knowing the going rate for your role is key.</p>
      <p style="margin-top:12px;">We put together a <strong class="highlight">2026 AV Rate Guide</strong> with national averages across 25 cities${primarySkill ? ` — including rates for <strong>${primarySkill}</strong> techs` : ""}.</p>
    </div>
    <div class="card">
      <h2>How to Become an AV Tech</h2>
      <p>Our career guide covers signal flow, department breakdowns, certifications, and what producers actually look for when hiring.</p>
    </div>
    <div style="text-align:center;">
      <a href="${SITE_URL}/rates" class="btn">View Rate Guide</a>
      <br>
      <a href="${SITE_URL}/learn" class="btn-outline">Read the Career Guide</a>
    </div>
  `, `${displayName}, check out the 2026 AV Rate Guide on Truss`);

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: `The 2026 AV Rate Guide is here`,
    html,
  });
}

export async function sendPayoutEmail(
  toEmail: string,
  techName: string,
  projectName: string,
  amount: number
) {
  const html = baseTemplate(`
    <div class="card" style="text-align:center;">
      <h2>You've Been Paid</h2>
      <p style="margin-top:12px;">Your payout for <strong class="highlight">${projectName}</strong> has been processed.</p>
      <p style="margin-top:16px;"><span class="amount">$${amount.toLocaleString()}</span></p>
      <p style="margin-top:8px; font-size:12px; color:#666;">Funds will arrive in your bank account within 2 business days.</p>
    </div>
    <div style="text-align:center;">
      <a href="${SITE_URL}/payouts" class="btn">View Payouts</a>
    </div>
  `, `You've been paid $${amount} for ${projectName}`);

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: `Payout processed — $${amount.toLocaleString()} for ${projectName}`,
    html,
  });
}

export async function sendGigReminderEmail(
  toEmail: string,
  techName: string,
  projectName: string,
  venue: string,
  city: string,
  startDate: string,
  role: string
) {
  const formattedDate = new Date(startDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const html = baseTemplate(`
    <div class="card">
      <h2>Gig Tomorrow</h2>
      <p>Hey <strong>${techName}</strong>, just a reminder — you have a gig tomorrow.</p>
    </div>
    <div class="card">
      <div class="detail-row">
        <span class="detail-label">Event</span>
        <span class="detail-value">${projectName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Role</span>
        <span class="detail-value">${role}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date</span>
        <span class="detail-value">${formattedDate}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Venue</span>
        <span class="detail-value">${venue || "TBD"}</span>
      </div>
      <div class="detail-row" style="border:none;">
        <span class="detail-label">City</span>
        <span class="detail-value">${city || "TBD"}</span>
      </div>
    </div>
    <div style="text-align:center;">
      <a href="${SITE_URL}/bookings" class="btn">View Booking</a>
    </div>
  `, `Reminder: ${projectName} is tomorrow at ${venue || city || "your venue"}`);

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: `Reminder: ${projectName} is tomorrow`,
    html,
  });
}

export async function sendPayoutNudgeEmail(
  toEmail: string,
  techName: string,
  pendingAmount: number,
  pendingCount: number
) {
  const html = baseTemplate(`
    <div class="card" style="text-align:center;">
      <h2>You Have Money Waiting</h2>
      <p style="margin-top:12px;"><span class="amount">$${pendingAmount.toLocaleString()}</span></p>
      <p style="margin-top:8px;">from ${pendingCount} completed gig${pendingCount !== 1 ? "s" : ""}</p>
      <p style="margin-top:16px; color:#8A8A8A;">Set up your bank account to receive your earnings. It only takes a few minutes.</p>
    </div>
    <div style="text-align:center;">
      <a href="${SITE_URL}/payouts" class="btn">Set Up Payouts</a>
    </div>
  `, `You have $${pendingAmount} waiting from ${pendingCount} gig${pendingCount !== 1 ? "s" : ""}`);

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: `You have $${pendingAmount.toLocaleString()} waiting on Truss`,
    html,
  });
}

export async function sendProjectFilesEmail(
  toEmail: string,
  techName: string,
  producerName: string,
  projectName: string,
  fileCount: number
) {
  const fileWord = fileCount === 1 ? "file" : "files";
  const html = baseTemplate(`
    <div class="card">
      <h2>New Project Files</h2>
      <p>Hey <strong>${techName}</strong>, <strong class="highlight">${producerName}</strong> uploaded <strong>${fileCount} ${fileWord}</strong> to <strong>${projectName}</strong>.</p>
      <p style="margin-top:12px; color: #8A8A8A;">Check your bookings to download schedules, venue specs, input lists, and other project documents.</p>
    </div>
    <div style="text-align:center;">
      <a href="${SITE_URL}/bookings" class="btn">View Bookings</a>
    </div>
  `, `${producerName} uploaded ${fileCount} ${fileWord} to ${projectName}`);

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: `New files for ${projectName}`,
    html,
  });
}

export async function sendSavedSearchAlertEmail(
  toEmail: string,
  producerName: string,
  searchLabel: string,
  newTechs: { name: string; skill: string; city: string; rate: number }[],
) {
  const techRows = newTechs
    .slice(0, 5)
    .map(
      (t) => `
    <div class="detail-row">
      <span class="detail-value">${t.name}</span>
      <span class="detail-label">${t.skill}${t.city ? ` · ${t.city}` : ""}${t.rate ? ` · $${t.rate}/hr` : ""}</span>
    </div>`
    )
    .join("");

  const moreText = newTechs.length > 5 ? `<p style="margin-top:12px;">... and ${newTechs.length - 5} more</p>` : "";

  const html = baseTemplate(`
    <div class="card">
      <h2>New Techs Match Your Search</h2>
      <p>Hey <strong>${producerName}</strong>, ${newTechs.length} new tech${newTechs.length !== 1 ? "s" : ""} match${newTechs.length === 1 ? "es" : ""} your saved search: <strong class="highlight">${searchLabel}</strong></p>
    </div>
    <div class="card">
      ${techRows}
      ${moreText}
    </div>
    <div style="text-align:center;">
      <a href="${SITE_URL}/browse" class="btn">Browse Techs</a>
      <br/>
      <a href="${SITE_URL}/dashboard" class="btn-outline">Manage Saved Searches</a>
    </div>
  `, `${newTechs.length} new tech${newTechs.length !== 1 ? "s" : ""} match your search "${searchLabel}"`);

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: `${newTechs.length} new tech${newTechs.length !== 1 ? "s" : ""} match your search`,
    html,
  });
}

// ─── Supabase Auth Email Templates ──────────────────────────
// These are static HTML strings with Go template variables ({{ .ConfirmationURL }}, etc.)
// Paste them into Supabase Dashboard > Authentication > Email Templates

const AUTH_CSS = `
body { margin: 0; padding: 0; background: #0A0A0F; color: #E8E6E3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
.container { max-width: 520px; margin: 0 auto; padding: 40px 24px; }
.logo { text-align: center; margin-bottom: 32px; }
.logo span { font-size: 14px; font-weight: 800; letter-spacing: 4px; color: #E8E6E3; }
.card { background: #12121A; border: 1px solid rgba(255,255,255,0.04); border-radius: 12px; padding: 28px; margin-bottom: 16px; }
.card h2 { margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #E8E6E3; }
.card p { margin: 0; font-size: 14px; color: #8A8A8A; line-height: 1.7; }
.btn { display: inline-block; padding: 14px 32px; background: #FF4D00; color: #fff !important; text-decoration: none; font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; border-radius: 10px; margin-top: 16px; }
.note { margin-top: 12px; font-size: 12px; color: #555; line-height: 1.6; }
.footer { text-align: center; padding-top: 24px; }
.footer p { font-size: 11px; color: #444; }
.footer a { color: #FF4D00; text-decoration: none; }
.preheader { display: none; max-height: 0; overflow: hidden; }
`;

function authTemplate(content: string, preheader: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${AUTH_CSS}</style>
</head>
<body>
  <div class="preheader">${preheader}</div>
  <div class="container">
    <div class="logo">
      <span>&#9650; TRUSS</span>
    </div>
    ${content}
    <div class="footer">
      <p><a href="https://trusswork.org">trusswork.org</a> &middot; The backbone of every show</p>
      <p style="margin-top:8px;">You're receiving this because you have a Truss account.</p>
    </div>
  </div>
</body>
</html>`;
}

export const CONFIRM_SIGNUP_TEMPLATE = authTemplate(`
    <div class="card">
      <h2>Confirm Your Email</h2>
      <p>Welcome to Truss. Confirm your email address to activate your account and start building your profile.</p>
      <div style="text-align:center;">
        <a href="{{ .ConfirmationURL }}" class="btn">Confirm Email</a>
      </div>
      <p class="note">If you didn't create a Truss account, you can safely ignore this email.</p>
    </div>`, "Confirm your email to get started on Truss");

export const RESET_PASSWORD_TEMPLATE = authTemplate(`
    <div class="card">
      <h2>Reset Your Password</h2>
      <p>We received a request to reset the password for your Truss account. Click below to choose a new password.</p>
      <div style="text-align:center;">
        <a href="{{ .ConfirmationURL }}" class="btn">Reset Password</a>
      </div>
      <p class="note">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    </div>`, "Reset your Truss password");

export const MAGIC_LINK_TEMPLATE = authTemplate(`
    <div class="card">
      <h2>Sign In to Truss</h2>
      <p>Click the link below to sign in to your Truss account. No password needed.</p>
      <div style="text-align:center;">
        <a href="{{ .ConfirmationURL }}" class="btn">Sign In</a>
      </div>
      <p class="note">This link expires in 24 hours. If you didn't request this, you can safely ignore this email.</p>
    </div>`, "Your Truss sign-in link");

// --- Additional Auth Templates ---

export const INVITE_USER_TEMPLATE = authTemplate(`
    <div class="card">
      <h2>You've Been Invited to Truss</h2>
      <p>Someone on Truss has invited you to join the platform. Click below to accept the invitation and set up your account.</p>
      <div style="text-align:center;">
        <a href="{{ .ConfirmationURL }}" class="btn">Accept Invitation</a>
      </div>
      <p class="note">If you weren't expecting this invitation, you can safely ignore this email.</p>
    </div>`, "You've been invited to join Truss");

export const CHANGE_EMAIL_TEMPLATE = authTemplate(`
    <div class="card">
      <h2>Confirm Email Change</h2>
      <p>We received a request to change your Truss account email to <strong style="color:#E8E6E3;">{{ .NewEmail }}</strong>. Click below to confirm this change.</p>
      <div style="text-align:center;">
        <a href="{{ .ConfirmationURL }}" class="btn">Confirm New Email</a>
      </div>
      <p class="note">If you didn't request this change, secure your account immediately by resetting your password.</p>
    </div>`, "Confirm your new email address on Truss");

export const REAUTHENTICATION_TEMPLATE = authTemplate(`
    <div class="card">
      <h2>Verify Your Identity</h2>
      <p>To complete this action, enter the verification code below in the confirmation dialog.</p>
      <div style="text-align:center;margin:20px 0;">
        <span style="display:inline-block;padding:16px 32px;background:#12121A;border:2px solid #FF4D00;border-radius:10px;font-size:28px;font-weight:700;letter-spacing:8px;color:#FF4D00;font-family:monospace;">{{ .Token }}</span>
      </div>
      <p class="note">This code expires shortly. If you didn't initiate this request, secure your account immediately.</p>
    </div>`, "Your Truss verification code");

// --- Security Notification Templates ---

export const PASSWORD_CHANGED_TEMPLATE = authTemplate(`
    <div class="card">
      <h2>Password Changed</h2>
      <p>The password for your Truss account (<strong style="color:#E8E6E3;">{{ .Email }}</strong>) was recently changed.</p>
      <p>If you made this change, no action is needed.</p>
      <p class="note" style="color:#FF4D00;">If you did not change your password, your account may be compromised. Reset your password immediately at <a href="https://trusswork.org/login" style="color:#FF4D00;text-decoration:underline;">trusswork.org</a>.</p>
    </div>`, "Your Truss password was changed");

export const EMAIL_CHANGED_TEMPLATE = authTemplate(`
    <div class="card">
      <h2>Email Address Changed</h2>
      <p>The email address on your Truss account was changed from <strong style="color:#E8E6E3;">{{ .OldEmail }}</strong> to <strong style="color:#E8E6E3;">{{ .Email }}</strong>.</p>
      <p>If you made this change, no action is needed.</p>
      <p class="note" style="color:#FF4D00;">If you did not make this change, your account may be compromised. Contact support immediately.</p>
    </div>`, "Your Truss email address was changed");

export const PHONE_CHANGED_TEMPLATE = authTemplate(`
    <div class="card">
      <h2>Phone Number Changed</h2>
      <p>The phone number on your Truss account (<strong style="color:#E8E6E3;">{{ .Email }}</strong>) was changed from <strong style="color:#E8E6E3;">{{ .OldPhone }}</strong> to <strong style="color:#E8E6E3;">{{ .Phone }}</strong>.</p>
      <p>If you made this change, no action is needed.</p>
      <p class="note" style="color:#FF4D00;">If you did not make this change, your account may be compromised. Secure your account immediately.</p>
    </div>`, "Your Truss phone number was changed");

export const IDENTITY_LINKED_TEMPLATE = authTemplate(`
    <div class="card">
      <h2>Identity Provider Linked</h2>
      <p>A new sign-in method was linked to your Truss account (<strong style="color:#E8E6E3;">{{ .Email }}</strong>).</p>
      <div style="text-align:center;margin:16px 0;">
        <span style="display:inline-block;padding:10px 24px;background:rgba(255,77,0,0.08);border:1px solid rgba(255,77,0,0.2);border-radius:8px;font-size:14px;font-weight:700;color:#FF4D00;text-transform:capitalize;">{{ .Provider }}</span>
      </div>
      <p>If you linked this provider, no action is needed.</p>
      <p class="note" style="color:#FF4D00;">If you did not link this provider, remove it from your account settings immediately.</p>
    </div>`, "A new sign-in method was linked to your Truss account");

export const IDENTITY_UNLINKED_TEMPLATE = authTemplate(`
    <div class="card">
      <h2>Identity Provider Removed</h2>
      <p>A sign-in method was removed from your Truss account (<strong style="color:#E8E6E3;">{{ .Email }}</strong>).</p>
      <div style="text-align:center;margin:16px 0;">
        <span style="display:inline-block;padding:10px 24px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;font-size:14px;font-weight:700;color:#8A8A8A;text-transform:capitalize;">{{ .Provider }}</span>
      </div>
      <p>If you removed this provider, no action is needed.</p>
      <p class="note" style="color:#FF4D00;">If you did not remove this provider, secure your account immediately.</p>
    </div>`, "A sign-in method was removed from your Truss account");

export const MFA_ENROLLED_TEMPLATE = authTemplate(`
    <div class="card">
      <h2>MFA Method Added</h2>
      <p>A new multi-factor authentication method was added to your Truss account (<strong style="color:#E8E6E3;">{{ .Email }}</strong>).</p>
      <div style="text-align:center;margin:16px 0;">
        <span style="display:inline-block;padding:10px 24px;background:rgba(255,77,0,0.08);border:1px solid rgba(255,77,0,0.2);border-radius:8px;font-size:14px;font-weight:700;color:#FF4D00;text-transform:uppercase;">{{ .FactorType }}</span>
      </div>
      <p>If you added this method, no action is needed. MFA helps keep your account secure.</p>
      <p class="note" style="color:#FF4D00;">If you did not add this, someone may have access to your account. Remove the method and change your password immediately.</p>
    </div>`, "A new MFA method was added to your Truss account");

export const MFA_UNENROLLED_TEMPLATE = authTemplate(`
    <div class="card">
      <h2>MFA Method Removed</h2>
      <p>A multi-factor authentication method was removed from your Truss account (<strong style="color:#E8E6E3;">{{ .Email }}</strong>).</p>
      <div style="text-align:center;margin:16px 0;">
        <span style="display:inline-block;padding:10px 24px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;font-size:14px;font-weight:700;color:#8A8A8A;text-transform:uppercase;">{{ .FactorType }}</span>
      </div>
      <p>If you removed this method, no action is needed.</p>
      <p class="note" style="color:#FF4D00;">If you did not remove this, your account security has been reduced. Re-enable MFA and change your password immediately.</p>
    </div>`, "An MFA method was removed from your Truss account");