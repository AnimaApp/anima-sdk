import { afterEach, describe, expect, it, vi } from "vitest";
import { Anima } from "./anima";
import { CodegenError } from "./errors";

afterEach(() => vi.unstubAllGlobals());

describe("Anima.stopJob", () => {
  it("calls the public API with the job ID and authentication", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "cancellation_requested" }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetch);
    const anima = new Anima({
      apiBaseAddress: "https://api.example.com",
      auth: { token: "token-1", teamId: "team-1" },
    });

    await expect(anima.stopJob({ sessionId: "session/1" })).resolves.toEqual({
      status: "cancellation_requested",
    });
    expect(fetch).toHaveBeenCalledWith(
      "https://api.example.com/v1/jobs/session%2F1/stop",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-1",
          "X-Team-Id": "team-1",
        },
      },
    );
  });

  it("surfaces a missing job as an SDK error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Job not found", { status: 404 })),
    );
    const anima = new Anima({ auth: { token: "token-1", teamId: "team-1" } });

    await expect(anima.stopJob({ sessionId: "missing" })).rejects.toMatchObject(
      {
        name: "HTTP error from Anima API",
        message: "Job not found",
        status: 404,
      } satisfies Partial<CodegenError>,
    );
  });
});

it("passes the queued session ID to callers so they can stop the job", async () => {
  const events = [
    { type: "queueing", payload: { sessionId: "queued-1" } },
    { type: "done", payload: { sessionId: "queued-1", tokenUsage: 0 } },
  ];
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response(
          events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join(""),
        ),
      ),
  );
  const onQueueing = vi.fn();
  const anima = new Anima({ auth: { token: "token-1", teamId: "team-1" } });

  await anima.attachToGenerationJob({ sessionId: "queued-1" }, { onQueueing });

  expect(onQueueing).toHaveBeenCalledWith({ sessionId: "queued-1" });
});
