import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { name, email, subject, message } = await request.json();

  const apiKey      = process.env.RESEND_API_KEY;
  const toEmail     = process.env.CONTACT_EMAIL;
  const fromAddress = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !toEmail || !fromAddress) {
    console.error("[contact] Email service not configured — message not sent:", {
      missing: {
        RESEND_API_KEY: !apiKey,
        CONTACT_EMAIL: !toEmail,
        RESEND_FROM_EMAIL: !fromAddress,
      },
      name,
      email,
      subject,
      message,
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
