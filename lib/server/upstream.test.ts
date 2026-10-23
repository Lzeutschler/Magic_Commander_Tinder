import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetUpstreams, upstreamFetch, UpstreamUnavailable } from "./upstream";

const respond = (status: number, headers: Record<string, string> = {}) =>
  vi.fn(async () => new Response("{}", { status, headers }));

describe("upstreamFetch", () => {
  beforeEach(() => {
    resetUpstreams();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("stops sending after the per-window limit and resumes in the next window", async () => {
    vi.stubGlobal("fetch", respond(200));
    for (let i = 0; i < 30; i++) await upstreamFetch("scryfall", "https://example.com");
    await expect(upstreamFetch("scryfall", "https://example.com")).rejects.toBeInstanceOf(UpstreamUnavailable);
    // Other services count separately.
    await expect(upstreamFetch("spellbook", "https://example.com")).resolves.toBeInstanceOf(Response);
    vi.advanceTimersByTime(10_001);
    await expect(upstreamFetch("scryfall", "https://example.com")).resolves.toBeInstanceOf(Response);
  });

  it("sends at most one request per second to EDHREC and gives up on a long queue", async () => {
    const fetch = respond(200);
    vi.stubGlobal("fetch", fetch);
    const queued = Array.from({ length: 5 }, () => upstreamFetch("edhrec", "https://example.com"));
    const tooLate = upstreamFetch("edhrec", "https://example.com");
    await expect(tooLate).rejects.toThrow("edhrec is busy");
    await vi.advanceTimersByTimeAsync(0);
    expect(fetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(999);
    expect(fetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(3_000);
    await Promise.all(queued);
    expect(fetch).toHaveBeenCalledTimes(5);
    // Services without a gap are not queued.
    await upstreamFetch("scryfall", "https://example.com");
    await upstreamFetch("scryfall", "https://example.com");
    expect(fetch).toHaveBeenCalledTimes(7);
  });

  it("drops queued EDHREC requests when an earlier one is rate limited", async () => {
    const fetch = respond(429);
    vi.stubGlobal("fetch", fetch);
    const first = upstreamFetch("edhrec", "https://example.com");
    const second = upstreamFetch("edhrec", "https://example.com");
    const rejected = expect(second).rejects.toThrow("edhrec is paused");
    expect((await first).status).toBe(429);
    await vi.advanceTimersByTimeAsync(1_000);
    await rejected;
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("pauses a service that rate limits or blocks us", async () => {
    const fetch = respond(429);
    vi.stubGlobal("fetch", fetch);
    expect((await upstreamFetch("edhrec", "https://example.com")).status).toBe(429);
    await expect(upstreamFetch("edhrec", "https://example.com")).rejects.toThrow("edhrec is paused");
    expect(fetch).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(5 * 60_000 + 1);
    await upstreamFetch("edhrec", "https://example.com");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("honours Retry-After and ignores ordinary 404s", async () => {
    vi.stubGlobal("fetch", respond(503, { "retry-after": "30" }));
    await upstreamFetch("spellbook", "https://example.com");
    vi.advanceTimersByTime(29_000);
    await expect(upstreamFetch("spellbook", "https://example.com")).rejects.toBeInstanceOf(UpstreamUnavailable);
    vi.advanceTimersByTime(2_000);
    vi.stubGlobal("fetch", respond(404));
    expect((await upstreamFetch("spellbook", "https://example.com")).status).toBe(404);
    expect((await upstreamFetch("spellbook", "https://example.com")).status).toBe(404);
  });
});
