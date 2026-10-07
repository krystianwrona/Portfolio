import { handleContactRequest, type ContactConfig, type SendEmail } from "@/lib/contact";

function readConfig(): ContactConfig | null {
  const apiKey      = process.env.RESEND_API_KEY;
  const toEmail     = process.env.CONTACT_EMAIL;
  const fromAddress = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !toEmail || !fromAddress) {
    // Config names only — never the values, never the message contents.
    console.error("[contact] Missing settings:", {
      RESEND_API_KEY: !apiKey,
      CONTACT_EMAIL: !toEmail,
      RESEND_FROM_EMAIL: !fromAddress,
    });
    return null;
  }
  return { apiKey, toEmail, fromAddress };
}

const sendWithResend: SendEmail = async (config, payload) => {
  const { Resend } = await import("resend");
  return new Resend(config.apiKey).emails.send(payload);
};

// Validation, the honeypot and the check of Resend's result live in
// src/lib/contact.ts (tested in tests/contact.test.mts). The rate limit is a
// Vercel WAF rule in front of this route — see README.md.
export async function POST(request: Request) {
  return handleContactRequest(request, { getConfig: readConfig, send: sendWithResend });
}
