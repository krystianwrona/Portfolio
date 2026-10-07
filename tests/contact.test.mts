// Contact handler tests. The sender is always a fake — nothing here talks to
// Resend or sends real email. Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CONTACT_LIMITS,
  MAX_BODY_BYTES,
  handleContactRequest,
  type ContactConfig,
  type ContactDeps,
  type EmailPayload,
} from "../src/lib/contact.ts";

const CONFIG: ContactConfig = {
  apiKey: "re_test_key_never_used",
  toEmail: "owner@example.com",
  fromAddress: "Portfolio <form@example.com>",
};

const VALID = {
  name: "Ada",
  email: "ada@example.com",
  subject: "Hello",
  message: "A message.\nOver two lines.",
  website: "",
};

type Harness = {
  deps: ContactDeps;
  sent: EmailPayload[];
  logs: { message: string; details?: Record<string, unknown> }[];
};

function harness(sendImpl: () => Promise<unknown>, config: ContactConfig | null = CONFIG): Harness {
  const sent: EmailPayload[] = [];
  const logs: Harness["logs"] = [];
  return {
    sent,
    logs,
    deps: {
      getConfig: () => config,
      send: async (_config, payload) => {
        sent.push(payload);
        return sendImpl();
      },
      logError: (message, details) => logs.push({ message, details }),
    },
  };
}

const accepted = () => Promise.resolve({ data: { id: "email_123" }, error: null });

function post(body: string): Request {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

async function call(body: unknown, h: Harness) {
  const raw = typeof body === "string" ? body : JSON.stringify(body);
  const res = await handleContactRequest(post(raw), h.deps);
  return { status: res.status, json: (await res.json()) as Record<string, unknown> };
}

// ── success ────────────────────────────────────────────────────────────────

test("accepted by the provider → 200 ok, one email with trimmed fields", async () => {
  const h = harness(accepted);
  const r = await call({ ...VALID, name: "  Ada  " }, h);
  assert.equal(r.status, 200);
  assert.deepEqual(r.json, { ok: true });
  assert.equal(h.sent.length, 1);
  assert.equal(h.sent[0].replyTo, "ada@example.com");
  assert.equal(h.sent[0].subject, "[Portfolio] Hello");
  assert.deepEqual(h.sent[0].to, ["owner@example.com"]);
  assert.match(h.sent[0].text, /Name: Ada\n/);
  assert.match(h.sent[0].text, /Over two lines\.$/);
});

test("missing honeypot field is still a valid message", async () => {
  const h = harness(accepted);
  const { website: _omit, ...withoutHoneypot } = VALID;
  void _omit;
  const r = await call(withoutHoneypot, h);
  assert.equal(r.status, 200);
  assert.equal(h.sent.length, 1);
});

// ── provider failures ──────────────────────────────────────────────────────

test("SDK resolves with { data: null, error } → 502, no success", async () => {
  const h = harness(() =>
    Promise.resolve({
      data: null,
      error: { name: "validation_error", statusCode: 403, message: "secret detail about re_live_key" },
    })
  );
  const r = await call(VALID, h);
  assert.equal(r.status, 502);
  assert.deepEqual(r.json, { ok: false, error: "send_failed" });
  // The provider's message (which could carry anything) is neither returned nor logged.
  assert.doesNotMatch(JSON.stringify(r.json), /secret|re_live/);
  assert.equal(h.logs.length, 1);
  assert.doesNotMatch(JSON.stringify(h.logs), /secret|re_live|Over two lines/);
  assert.equal(h.logs[0].details?.statusCode, 403);
});

test("SDK resolves with no error but no email id → 502", async () => {
  for (const result of [{ data: null, error: null }, { data: {}, error: null }, { data: { id: "" } }, undefined, "ok"]) {
    const h = harness(() => Promise.resolve(result));
    const r = await call(VALID, h);
    assert.equal(r.status, 502, `result ${JSON.stringify(result)}`);
    assert.equal(r.json.ok, false);
  }
});

test("SDK throws (network) → 502 with a generic code", async () => {
  const h = harness(() => Promise.reject(new TypeError("fetch failed: ECONNRESET to api.resend.com")));
  const r = await call(VALID, h);
  assert.equal(r.status, 502);
  assert.deepEqual(r.json, { ok: false, error: "send_failed" });
  assert.doesNotMatch(JSON.stringify(h.logs), /ECONNRESET|Ada/);
});

test("missing configuration → 500 not_configured, nothing sent", async () => {
  const h = harness(accepted, null);
  const r = await call(VALID, h);
  assert.equal(r.status, 500);
  assert.deepEqual(r.json, { ok: false, error: "not_configured" });
  assert.equal(h.sent.length, 0);
});

// ── honeypot ───────────────────────────────────────────────────────────────

test("filled honeypot → fake 200 success and nothing sent", async () => {
  const h = harness(accepted);
  const r = await call({ ...VALID, website: "https://spam.example" }, h);
  assert.equal(r.status, 200);
  assert.deepEqual(r.json, { ok: true });
  assert.equal(h.sent.length, 0);
});

// ── invalid input ──────────────────────────────────────────────────────────

const INVALID_BODIES: [string, string][] = [
  ["empty body", ""],
  ["malformed JSON", "{\"name\": "],
  ["JSON null", "null"],
  ["JSON array", JSON.stringify([VALID])],
  ["JSON string", JSON.stringify("hello")],
  ["JSON number", "42"],
  ["empty object", "{}"],
  ["name is a number", JSON.stringify({ ...VALID, name: 42 })],
  ["message is an object", JSON.stringify({ ...VALID, message: { text: "hi" } })],
  ["email is an array", JSON.stringify({ ...VALID, email: ["ada@example.com"] })],
  ["honeypot is not a string", JSON.stringify({ ...VALID, website: 1 })],
  ["subject missing", JSON.stringify({ ...VALID, subject: undefined })],
  ["whitespace-only name", JSON.stringify({ ...VALID, name: "   " })],
  ["invalid email", JSON.stringify({ ...VALID, email: "not-an-email" })],
  ["line break in subject", JSON.stringify({ ...VALID, subject: "Hi\nBcc: x@example.com" })],
  ["line break in email", JSON.stringify({ ...VALID, email: "ada@example.com\r\nBcc: x@example.com" })],
  ["name over limit", JSON.stringify({ ...VALID, name: "a".repeat(CONTACT_LIMITS.name + 1) })],
  ["subject over limit", JSON.stringify({ ...VALID, subject: "a".repeat(CONTACT_LIMITS.subject + 1) })],
  ["message over limit", JSON.stringify({ ...VALID, message: "a".repeat(CONTACT_LIMITS.message + 1) })],
];

for (const [label, body] of INVALID_BODIES) {
  test(`invalid input (${label}) → 400, nothing sent`, async () => {
    const h = harness(accepted);
    const r = await call(body, h);
    assert.equal(r.status, 400);
    assert.deepEqual(r.json, { ok: false, error: "invalid_request" });
    assert.equal(h.sent.length, 0);
  });
}

test("fields exactly at their limits are accepted", async () => {
  const h = harness(accepted);
  const r = await call(
    {
      name: "a".repeat(CONTACT_LIMITS.name),
      email: "ada@example.com",
      subject: "s".repeat(CONTACT_LIMITS.subject),
      message: "m".repeat(CONTACT_LIMITS.message),
    },
    h
  );
  assert.equal(r.status, 200);
  assert.equal(h.sent.length, 1);
});

test("oversized raw body → 413 before parsing, nothing sent", async () => {
  const h = harness(accepted);
  const r = await call(JSON.stringify({ ...VALID, padding: "x".repeat(MAX_BODY_BYTES) }), h);
  assert.equal(r.status, 413);
  assert.deepEqual(r.json, { ok: false, error: "payload_too_large" });
  assert.equal(h.sent.length, 0);
});
