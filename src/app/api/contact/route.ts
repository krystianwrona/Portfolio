import { NextResponse } from "next/server";

const MAX_LENGTHS = {
  name: 200,
  email: 320,
  subject: 300,
  message: 5000,
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Honeypot — the form's hidden "website" field. Humans never see it; a
  // filled value means a bot, which gets a fake success so it stops retrying.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  for (const [field, max] of Object.entries(MAX_LENGTHS)) {
    const value = body[field];
    if (typeof value !== "string" || value.trim() === "" || value.length > max) {
      return NextResponse.json({ error: `Invalid field: ${field}.` }, { status: 400 });
    }
  }
  const { name, email, subject, message } = body as Record<keyof typeof MAX_LENGTHS, string>;

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  const apiKey      = process.env.RESEND_API_KEY;
  const toEmail     = process.env.CONTACT_EMAIL;
  const fromAddress = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !toEmail || !fromAddress) {
    // Config names only — never the message contents (PII in logs).
    console.error("[contact] Email service not configured — missing:", {
      RESEND_API_KEY: !apiKey,
      CONTACT_EMAIL: !toEmail,
      RESEND_FROM_EMAIL: !fromAddress,
    });
    return NextResponse.json(
      { error: "Email service is not configured. Please email me directly." },
      { status: 500 }
    );
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
