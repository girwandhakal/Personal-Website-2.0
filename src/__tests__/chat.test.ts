import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The route talks to Postgres (via Prisma) for sessions/bans/telemetry and to
// Groq over the network for the actual completion. Both are mocked so these
// tests are deterministic and don't depend on live infrastructure.
const prismaMock = {
  bannedFingerprint: { findUnique: vi.fn(), upsert: vi.fn() },
  chatMessage: { count: vi.fn(), create: vi.fn(), findMany: vi.fn() },
  llmLog: { count: vi.fn(), create: vi.fn() },
  chatSession: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  knowledgeChunk: { findMany: vi.fn() }
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

function resetPrismaMock() {
  prismaMock.bannedFingerprint.findUnique.mockReset().mockResolvedValue(null);
  prismaMock.bannedFingerprint.upsert.mockReset().mockResolvedValue({});
  prismaMock.chatMessage.count.mockReset().mockResolvedValue(0);
  prismaMock.chatMessage.create.mockReset().mockImplementation(({ data }: any) =>
    Promise.resolve({ id: "msg-1", ...data })
  );
  prismaMock.chatMessage.findMany.mockReset().mockResolvedValue([]);
  prismaMock.llmLog.count.mockReset().mockResolvedValue(0);
  prismaMock.llmLog.create.mockReset().mockResolvedValue({});
  prismaMock.chatSession.findUnique.mockReset().mockResolvedValue(null);
  prismaMock.chatSession.create.mockReset().mockImplementation(({ data }: any) =>
    Promise.resolve({ ...data, messages: [] })
  );
  prismaMock.chatSession.update.mockReset().mockResolvedValue({});
  prismaMock.knowledgeChunk.findMany.mockReset().mockResolvedValue([]);
}

const validSessionKey = "a".repeat(64);

function chatRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-session-key": validSessionKey,
      "x-device-fingerprint": "fp-1",
      ...headers
    },
    body: JSON.stringify(body)
  });
}

async function readStreamText(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
  }
  return text;
}

/** Non-streaming Groq JSON response, used for the classification call. */
function groqJsonResponse(content: string, status = 200) {
  return new Response(
    JSON.stringify({ choices: [{ message: { content } }] }),
    { status }
  );
}

/** SSE-formatted streaming Groq response, used for the completion call. */
function groqStreamResponse(chunks: string[]) {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`)
        );
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    }
  });
  return new Response(body, { status: 200 });
}

describe("POST /api/chat", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    resetPrismaMock();
    vi.stubEnv("GROQ_API_KEY", "gsk_test_key");
    vi.stubEnv("GROQ_MODEL", ""); // exercise the default fallback
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("streams a reply on the happy path and logs telemetry", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string, init: RequestInit) => {
      const parsed = JSON.parse(init.body as string);
      if (parsed.stream) return Promise.resolve(groqStreamResponse(["Hello", " there"]));
      return Promise.resolve(groqJsonResponse(JSON.stringify({ category: "profile_general" })));
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(chatRequest({ message: "Hi", sessionId: "session-1" }) as any);

    expect(response.status).toBe(200);
    const text = await readStreamText(response);
    expect(text).toBe("Hello there");
    expect(prismaMock.llmLog.create).toHaveBeenCalled();
    expect(prismaMock.chatMessage.create).toHaveBeenCalled();
  });

  // Regression test for the reported bug: Groq decommissioned
  // `llama-3.1-8b-instant`, so every completion call returned 404 and the route
  // surfaced a generic "[SERVER ERROR]" with no way to tell what actually failed.
  // The route must fail with a clear status and message, not crash or hang.
  it("returns a clear error when the configured Groq model is unavailable", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string, init: RequestInit) => {
      const parsed = JSON.parse(init.body as string);
      if (parsed.stream) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ error: { message: "model_not_found", code: "model_not_found" } }),
            { status: 404 }
          )
        );
      }
      return Promise.resolve(groqJsonResponse(JSON.stringify({ category: "profile_general" })));
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(chatRequest({ message: "Hi", sessionId: "session-2" }) as any);
    const text = await response.text();

    expect(response.status).toBe(502);
    expect(text).toMatch(/unavailable/i);
  });

  it("honors GROQ_MODEL override instead of the hardcoded default", async () => {
    vi.stubEnv("GROQ_MODEL", "some-future-model");
    const fetchMock = vi.fn().mockImplementation((url: string, init: RequestInit) => {
      const parsed = JSON.parse(init.body as string);
      if (parsed.stream) return Promise.resolve(groqStreamResponse(["ok"]));
      return Promise.resolve(groqJsonResponse(JSON.stringify({ category: "profile_general" })));
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { POST } = await import("@/app/api/chat/route");
    await POST(chatRequest({ message: "Hi", sessionId: "session-3" }) as any);

    const streamingCall = fetchMock.mock.calls.find(
      ([, init]: any) => JSON.parse(init.body).stream
    );
    expect(JSON.parse(streamingCall[1].body).model).toBe("some-future-model");
  });

  it("rejects a request with a missing or malformed session key before calling Groq", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(
      chatRequest({ message: "Hi", sessionId: "session-4" }, { "x-session-key": "too-short" }) as any
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a request missing the message or sessionId before calling Groq", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(chatRequest({ message: "" }) as any);

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an oversized message before calling Groq", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(
      chatRequest({ message: "a".repeat(401), sessionId: "session-5" }) as any
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks a banned device fingerprint before calling Groq", async () => {
    prismaMock.bannedFingerprint.findUnique.mockResolvedValue({ fingerprint: "fp-1" });
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(chatRequest({ message: "Hi", sessionId: "session-6" }) as any);

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not crash and returns a 5xx when the database is unreachable", async () => {
    prismaMock.bannedFingerprint.findUnique.mockRejectedValue(new Error("Can't reach database server"));
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(chatRequest({ message: "Hi", sessionId: "session-7" }) as any);

    expect(response.status).toBeGreaterThanOrEqual(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
