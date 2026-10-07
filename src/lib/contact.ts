/**
 * The contact form's server logic, kept free of Next.js and of the Resend SDK
 * so it can be tested with plain Request objects and a fake sender. The route
 * (src/app/api/contact/route.ts) only wires the real environment and the real
 * SDK into it.
 *
 * Rate limiting is deliberately not in here. A counter in this module would
 * live in one function instance's memory, and Vercel runs as many instances as
 * traffic needs — each with its own counter — so it would limit nothing across
 * the deployment. The limit is a Vercel WAF rule in front of the route; see
 * "Contact form: spam protection" in README.md.
 */

export const CONTACT_LIMITS = {
  name: 200,
  email: 320,
  subject: 300,
  message: 5000,
} as const;

type ContactField = keyof typeof CONTACT_LIMITS;
const FIELDS = Object.keys(CONTACT_LIMITS) as ContactField[];

/** Generous ceiling for the raw body: every field at its limit fits well under it. */
export const MAX_BODY_BYTES = 16 * 1024;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Name, email and subject end up in email headers (subject, reply-to). A line
// break has no business in any of them, and the form's inputs cannot produce one.
const LINE_BREAK_RE = /[\r\n]/;

export type ContactMessage = Record<ContactField, string>;

export type ContactConfig = {
  apiKey: string;
  toEmail: string;
  fromAddress: string;
};

export type EmailPayload = {
  from: string;
  to: string[];
  replyTo: string;
  subject: string;
  text: string;
};

/**
 * Sends one email. Resolves with whatever the provider returned — the handler
 * decides whether that counts as accepted, so a sender never has to.
 */
export type SendEmail = (config: ContactConfig, payload: EmailPayload) => Promise<unknown>;

export type ContactDeps = {
  /**
   * Read only once the message is valid, so junk requests cost no config
   * lookup. Null when any setting is missing (the caller logs which).
   */
  getConfig: () => ContactConfig | null;
  send: SendEmail;
  /** Defaults to console.error. Never receives message contents. */
  logError?: (message: string, details?: Record<string, unknown>) => void;
};

/** Error codes the form can react to. Never provider details. */
export type ContactErrorCode =
  | "invalid_request"
  | "payload_too_large"
  | "not_configured"
  | "send_failed";

type Parsed =
  | { kind: "message"; message: ContactMessage }
  | { kind: "spam" }
  | { kind: "invalid" };

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

function fail(code: ContactErrorCode, status: number): Response {
  return json({ ok: false, error: code }, status);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Validates an already-parsed JSON value. Reads no field before the shape is known. */
export function parseContactBody(raw: unknown): Parsed {
  if (!isPlainObject(raw)) return { kind: "invalid" };

  // Honeypot — the form's hidden "website" field. Humans never see it; a
  // filled value means a bot, which gets a fake success so it stops retrying.
  // Absent is fine (older clients), but it has to be a string when present.
  const website = raw.website;
  if (website !== undefined && typeof website !== "string") return { kind: "invalid" };
  if (typeof website === "string" && website.trim() !== "") return { kind: "spam" };

  const message = {} as ContactMessage;
  for (const field of FIELDS) {
    const value = raw[field];
    if (typeof value !== "string") return { kind: "invalid" };
    const trimmed = value.trim();
    if (trimmed === "" || trimmed.length > CONTACT_LIMITS[field]) return { kind: "invalid" };
    if (field !== "message" && LINE_BREAK_RE.test(trimmed)) return { kind: "invalid" };
    message[field] = trimmed;
  }
  if (!EMAIL_RE.test(message.email)) return { kind: "invalid" };

  return { kind: "message", message };
}

/**
 * Resend reports most failures — rejected sender, bad key, its own outages —
 * as a resolved `{ data: null, error }`, not as a throw. Only a response with
 * no error and an email id counts as accepted.
 */
export function isAccepted(result: unknown): boolean {
  if (!isPlainObject(result)) return false;
  if (result.error !== null && result.error !== undefined) return false;
  const data = result.data;
  return isPlainObject(data) && typeof data.id === "string" && data.id.length > 0;
}

/** Only the parts of a provider error that are safe to log: no message text, no key. */
function describeProviderError(result: unknown): Record<string, unknown> {
  const error = isPlainObject(result) ? result.error : undefined;
  if (!isPlainObject(error)) return { hasError: false };
  return {
    hasError: true,
    name: typeof error.name === "string" ? error.name : undefined,
    statusCode: typeof error.statusCode === "number" ? error.statusCode : undefined,
  };
}

export function buildEmail(config: ContactConfig, message: ContactMessage): EmailPayload {
  return {
    from: config.fromAddress,
    to: [config.toEmail],
    replyTo: message.email,
    subject: `[Portfolio] ${message.subject}`,
    text: `Name: ${message.name}\nEmail: ${message.email}\n\nMessage:\n${message.message}`,
  };
}

export async function handleContactRequest(request: Request, deps: ContactDeps): Promise<Response> {
  const logError = deps.logError ?? ((msg, details) => console.error(msg, details ?? ""));

  // Read the body as text first: the size check has to happen before parsing,
  // and request.json() would hide the difference between "not JSON" and "empty".
  let text: string;
  try {
    text = await request.text();
  } catch {
    return fail("invalid_request", 400);
  }
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    return fail("payload_too_large", 413);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return fail("invalid_request", 400);
  }

  const parsed = parseContactBody(raw);
  if (parsed.kind === "invalid") return fail("invalid_request", 400);
  if (parsed.kind === "spam") return json({ ok: true });

  const config = deps.getConfig();
  if (!config) return fail("not_configured", 500);

  let result: unknown;
  try {
    result = await deps.send(config, buildEmail(config, parsed.message));
  } catch (error) {
    logError("[contact] Email provider threw", {
      name: error instanceof Error ? error.name : typeof error,
    });
    return fail("send_failed", 502);
  }

  if (!isAccepted(result)) {
    logError("[contact] Email provider did not accept the message", describeProviderError(result));
    return fail("send_failed", 502);
  }

  return json({ ok: true });
}
