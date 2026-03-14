import twilio from "twilio";

let client: ReturnType<typeof twilio> | null = null;

function getTwilio() {
  if (!client) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) return null;
    client = twilio(sid, token);
  }
  return client;
}

const FROM = process.env.TWILIO_PHONE_NUMBER;

async function sendSMS(to: string, body: string) {
  const tw = getTwilio();
  if (!tw || !FROM || !to) return;
  try {
    await tw.messages.create({ body, from: FROM, to });
  } catch (err) {
    console.error("SMS send failed:", err);
  }
}

export async function smsBookingRequest(phone: string, producerName: string, projectName: string) {
  await sendSMS(phone, `Truss: ${producerName} sent you a booking request for ${projectName}. Open the app to respond.`);
}

export async function smsBookingAccepted(phone: string, techName: string, projectName: string) {
  await sendSMS(phone, `Truss: ${techName} accepted your booking for ${projectName}. Confirm & pay now.`);
}

export async function smsGigReminder(phone: string, projectName: string, venue: string, city: string) {
  const location = venue || city || "your venue";
  await sendSMS(phone, `Truss: Reminder — ${projectName} is tomorrow at ${location}. Have a great show!`);
}
