import type { SubscriptionTier } from "./types";

export const SUBSCRIPTION_LIMITS = {
  basic: {
    dailyStreams: 60,
    playlists: 6,
    avatar: false,
    download: false,
    earlyAccess: false,
    stats: false,
  },
  silver: {
    dailyStreams: Infinity,
    playlists: 100,
    avatar: true,
    download: true,
    earlyAccess: false,
    stats: false,
  },
  gold: {
    dailyStreams: Infinity,
    playlists: Infinity,
    avatar: true,
    download: true,
    earlyAccess: true,
    stats: true,
  },
} as const;

export function getPlaylistLimit(tier: SubscriptionTier): number {
  return SUBSCRIPTION_LIMITS[tier].playlists;
}

export function canUploadAvatar(tier: SubscriptionTier): boolean {
  return SUBSCRIPTION_LIMITS[tier].avatar;
}

export function canDownload(tier: SubscriptionTier): boolean {
  return SUBSCRIPTION_LIMITS[tier].download;
}

export function canSeeEarlyAccess(tier: SubscriptionTier): boolean {
  return SUBSCRIPTION_LIMITS[tier].earlyAccess;
}

export function canSeeStats(tier: SubscriptionTier): boolean {
  return SUBSCRIPTION_LIMITS[tier].stats;
}

export function getDailyStreamLimit(tier: SubscriptionTier): number {
  return SUBSCRIPTION_LIMITS[tier].dailyStreams;
}

export function canCreatePlaylist(
  tier: SubscriptionTier,
  currentCount: number
): boolean {
  const limit = getPlaylistLimit(tier);
  return currentCount < limit;
}

export function canStream(
  tier: SubscriptionTier,
  dailyCount: number
): boolean {
  const limit = getDailyStreamLimit(tier);
  return dailyCount < limit;
}

export const TIER_LABELS: Record<SubscriptionTier, string> = {
  basic: "پایه",
  silver: "نقره‌ای",
  gold: "طلایی",
};

export const ROLE_LABELS = {
  listener: "شنونده",
  artist: "هنرمند",
  support: "پشتیبان",
  admin: "مدیر",
} as const;
