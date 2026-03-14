import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      // Silently succeed if Resend isn't configured (dev/preview)
      return NextResponse.json({ ok: true });
    }

    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: "Truss Contact Form <crew@trusswork.org>",
      to: "hello@trusswork.org",
      replyTo: email.trim(),
      subject: `[Contact] ${subject?.trim() || "General Inquiry"} — ${name.trim()}`,
      text: `Name: ${name.trim()}\nEmail: ${email.trim()}\nSubject: ${subject?.trim() || "General Inquiry"}\n\n${message.trim()}`,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
