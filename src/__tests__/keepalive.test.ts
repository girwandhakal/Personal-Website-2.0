import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = { knowledgeChunk: { findFirst: vi.fn() } };
vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

function cronRequest(auth?: string) {
  return new Request("http://localhost/api/keepalive", { headers: auth ? { authorization: auth } : {} });
}

describe("GET /api/keepalive", () => {
  beforeEach(() => {
    prismaMock.knowledgeChunk.findFirst.mockReset().mockResolvedValue({ id: "chunk-1" });
    vi.stubEnv("CRON_SECRET", "cron-secret");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("queries the database when called with the cron secret", async () => {
    const { GET } = await import("@/app/api/keepalive/route");
    const response = await GET(cronRequest("Bearer cron-secret"));
    expect(response.status).toBe(200);
    expect(prismaMock.knowledgeChunk.findFirst).toHaveBeenCalledTimes(1);
  });

  it("refuses callers without the secret, and never touches the database", async () => {
    const { GET } = await import("@/app/api/keepalive/route");
    expect((await GET(cronRequest())).status).toBe(401);
    expect((await GET(cronRequest("Bearer wrong"))).status).toBe(401);
    expect(prismaMock.knowledgeChunk.findFirst).not.toHaveBeenCalled();
  });

  it("stays closed when no secret is configured", async () => {
    vi.stubEnv("CRON_SECRET", "");
    const { GET } = await import("@/app/api/keepalive/route");
    expect((await GET(cronRequest("Bearer "))).status).toBe(401);
  });

  it("reports a failed query instead of throwing", async () => {
    prismaMock.knowledgeChunk.findFirst.mockRejectedValue(new Error("paused"));
    const { GET } = await import("@/app/api/keepalive/route");
    expect((await GET(cronRequest("Bearer cron-secret"))).status).toBe(503);
  });
});
