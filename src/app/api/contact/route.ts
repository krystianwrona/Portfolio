import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { name, email, subject, message } = await request.json();

  const apiKey      = process.env.RESEND_API_KEY;
  const toEmail     = process.env.CONTACT_EMAIL ?? "your-email@domain.com"; // TODO: set CONTACT_EMAIL in .env
  const fromAddress = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  // Dev fallback — no API key configured
  if (!apiKey) {
    console.log("[contact] Dev mode — RESEND_API_KEY not set. Form data:", {
      name,
      email,
      subject,
      message,
    });
    return NextResponse.json({ ok: true });
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: fromAddress,
      to: [toEmail],
      replyTo: email,
      subject: `[Portfolio] ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[contact] Failed to send email:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }
}
