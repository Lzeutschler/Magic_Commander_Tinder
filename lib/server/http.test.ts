import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { isEdhrecSlug } from "@/lib/edhrec/types";

import { redirectToCanonical, rejectCrossSite } from "./http";

const request = (url: string, headers: Record<string, string> = {}) => new NextRequest(`https://www.brewmance.app${url}`, { headers });

describe("API guards", () => {
  it("send other websites' browser requests away, but not our own or scripts", () => {
    expect(rejectCrossSite(request("/api/tokens", { "sec-fetch-site": "cross-site" }))?.status).toBe(403);
    expect(rejectCrossSite(request("/api/tokens", { "sec-fetch-site": "same-origin" }))).toBeNull();
    expect(rejectCrossSite(request("/api/tokens"))).toBeNull();
  });

  it("leave canonical queries alone, whatever the encoding", () => {
    const params: [string, string | null][] = [["commander", "Krenko, Mob Boss"], ["bracket", "3"], ["theme", null]];
    expect(redirectToCanonical(request("/api/candidates?commander=Krenko%2C+Mob+Boss&bracket=3"), params)).toBeNull();
    expect(redirectToCanonical(request("/api/candidates?commander=Krenko,%20Mob%20Boss&bracket=3"), params)).toBeNull();
  });

  it("redirect stray, reordered or unnormalized parameters to the one cacheable URL", () => {
    const params: [string, string | null][] = [["commander", "Krenko, Mob Boss"], ["bracket", "3"], ["theme", "tokens"]];
    for (const url of [
      "/api/candidates?commander=Krenko%2C+Mob+Boss&bracket=3&theme=tokens&x=1",
      "/api/candidates?bracket=3&commander=Krenko%2C+Mob+Boss&theme=tokens",
      "/api/candidates?commander=krenko+mob+boss&bracket=3&theme=tokens",
    ]) {
      const res = redirectToCanonical(request(url), params);
      expect(res?.status).toBe(308);
      expect(res?.headers.get("location")).toBe("/api/candidates?commander=Krenko%2C+Mob+Boss&bracket=3&theme=tokens");
    }
  });

  it("only let EDHREC slugs into EDHREC URLs", () => {
    expect(isEdhrecSlug("tokens")).toBe(true);
    expect(isEdhrecSlug("plus-1-plus-1-counters")).toBe(true);
    expect(isEdhrecSlug("kraum-ludevics-opus-tymna-the-weaver")).toBe(true);
    for (const bad of ["../../cards/sol-ring", "Tokens", "tokens?x=1", "a/b", "", "-tokens", "x".repeat(161)]) {
      expect(isEdhrecSlug(bad)).toBe(false);
    }
  });
});
