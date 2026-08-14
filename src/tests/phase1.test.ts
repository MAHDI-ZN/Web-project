import { describe, expect, it } from "vitest";
import {
  canCreatePlaylist,
  canStream,
  canUploadAvatar,
  canSeeStats,
  canSeeEarlyAccess,
  getPlaylistLimit,
  getDailyStreamLimit,
} from "@/lib/subscription";
import { unwrapList } from "@/lib/api/client";
import { homePathForRole } from "@/stores/appStore";

describe("subscription rules", () => {
  it("limits playlists by tier", () => {
    expect(getPlaylistLimit("basic")).toBe(6);
    expect(getPlaylistLimit("silver")).toBe(100);
    expect(getPlaylistLimit("gold")).toBe(Infinity);
    expect(canCreatePlaylist("basic", 5)).toBe(true);
    expect(canCreatePlaylist("basic", 6)).toBe(false);
    expect(canCreatePlaylist("gold", 1000)).toBe(true);
  });

  it("limits daily streams for basic", () => {
    expect(getDailyStreamLimit("basic")).toBe(60);
    expect(canStream("basic", 59)).toBe(true);
    expect(canStream("basic", 60)).toBe(false);
    expect(canStream("gold", 1000)).toBe(true);
  });

  it("gates avatar download stats and early access", () => {
    expect(canUploadAvatar("basic")).toBe(false);
    expect(canUploadAvatar("silver")).toBe(true);
    expect(canSeeStats("gold")).toBe(true);
    expect(canSeeStats("silver")).toBe(false);
    expect(canSeeEarlyAccess("gold")).toBe(true);
    expect(canSeeEarlyAccess("basic")).toBe(false);
  });
});

describe("routing and api helpers", () => {
  it("routes staff to admin home", () => {
    expect(homePathForRole("admin")).toBe("/admin/tickets");
    expect(homePathForRole("support")).toBe("/admin/tickets");
    expect(homePathForRole("listener")).toBe("/home");
    expect(homePathForRole("artist")).toBe("/home");
  });

  it("unwraps paginated or plain lists", () => {
    expect(unwrapList([1, 2])).toEqual([1, 2]);
    expect(unwrapList({ results: [3] })).toEqual([3]);
  });

  it("cycles repeat modes correctly", () => {
    const cycle = (mode: "off" | "all" | "one") =>
      mode === "off" ? "all" : mode === "all" ? "one" : "off";
    expect(cycle("off")).toBe("all");
    expect(cycle("all")).toBe("one");
    expect(cycle("one")).toBe("off");
  });
});
