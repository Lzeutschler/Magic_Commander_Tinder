import "server-only";

export type Upstream = "edhrec" | "spellbook" | "scryfall";

/** Requests per service and server instance within one window; more wait for the next window. */
const MAX_REQUESTS = 30;
const WINDOW_MS = 10_000;
/** How long a service is left alone after it answers 429, 403 or 5xx (unless it sends Retry-After). */
const PAUSE_MS = 5 * 60_000;
/** Shorter pause after a timeout or network error, which may just be a hiccup. */
const NETWORK_PAUSE_MS = 60_000;

/** The service is paused or busy; callers fall back as if it had no data. */
export class UpstreamUnavailable extends Error {
  constructor(readonly upstream: Upstream, reason: string) {
    super(`${upstream} ${reason}`);
  }
}

const state: Record<Upstream, { pausedUntil: number; recent: number[] }> = {
  edhrec: { pausedUntil: 0, recent: [] },
  spellbook: { pausedUntil: 0, recent: [] },
  scryfall: { pausedUntil: 0, recent: [] },
};

/**
 * `fetch` for third-party services with two guards per server instance: a rate limit, so a traffic spike
 * or a bot cannot turn into a flood of requests to them, and a pause after they signal trouble (rate
 * limit, block or server error), so we stop instead of retrying into it. Throws `UpstreamUnavailable`
 * when a request is not sent.
 */
export async function upstreamFetch(upstream: Upstream, url: string, init?: RequestInit): Promise<Response> {
  const service = state[upstream];
  const now = Date.now();
  if (service.pausedUntil > now) throw new UpstreamUnavailable(upstream, "is paused");
  service.recent = service.recent.filter((at) => now - at < WINDOW_MS);
  if (service.recent.length >= MAX_REQUESTS) throw new UpstreamUnavailable(upstream, "is busy");
  service.recent.push(now);

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    service.pausedUntil = Date.now() + NETWORK_PAUSE_MS;
    throw err;
  }
  if (res.status === 429 || res.status === 403 || res.status >= 500) {
    const retryAfter = Number(res.headers.get("retry-after"));
    service.pausedUntil = Date.now() + (retryAfter > 0 ? Math.min(retryAfter * 1000, PAUSE_MS * 6) : PAUSE_MS);
  }
  return res;
}

/** For tests: forget all pauses and counts. */
export function resetUpstreams() {
  for (const service of Object.values(state)) {
    service.pausedUntil = 0;
    service.recent = [];
  }
}
