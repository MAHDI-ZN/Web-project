"use client";

import { create } from "zustand";
import { api, setToken } from "@/lib/api";
import { ApiError, getToken } from "@/lib/api/client";
import type {
  Album,
  AppNotification,
  ArtistPayout,
  Playlist,
  SubscriptionPrices,
  Ticket,
  TicketStatus,
  Track,
  User,
  UserRole,
  UserSettings,
} from "@/lib/types";

interface AppState {
  hydrated: boolean;
  currentUser: User | null;
  users: User[];
  tracks: Track[];
  albums: Album[];
  playlists: Playlist[];
  notifications: AppNotification[];
  tickets: Ticket[];
  payouts: ArtistPayout[];
  prices: SubscriptionPrices;
  recommendations: Track[];
  recentPlaylistIds: string[];
  adminReport: {
    userCount: number;
    subscriptionDistribution: { basic: number; silver: number; gold: number };
    silverUserCount: number;
    goldUserCount: number;
    monthlyRevenue: number;
  } | null;

  setHydrated: (v: boolean) => void;
  getCurrentUser: () => User | null;
  getUser: (id: string) => User | undefined;
  getTrack: (id: string) => Track | undefined;
  getAlbum: (id: string) => Album | undefined;

  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string; user?: User }>;
  logout: () => void;
  registerListener: (data: {
    displayName: string;
    email: string;
    password: string;
    birthDate: string;
    gender: User["gender"];
  }) => Promise<{ ok: boolean; error?: string }>;
  registerArtist: (data: {
    email: string;
    password: string;
    stageName: string;
    sampleWorks: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ ok: boolean; message: string }>;

  updateUser: (id: string, patch: Partial<User>, avatarFile?: File | null) => Promise<void>;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  followUser: (targetId: string) => Promise<void>;
  unfollowUser: (targetId: string) => Promise<void>;

  createPlaylist: (name: string) => Promise<{ ok: boolean; error?: string; playlist?: Playlist }>;
  renamePlaylist: (id: string, name: string) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<{ ok: boolean; error?: string }>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  touchRecentPlaylist: (id: string) => void;

  publishTrack: (form: FormData) => Promise<{ ok: boolean; error?: string; track?: Track }>;
  updateTrack: (id: string, form: FormData) => Promise<void>;
  deleteTrack: (id: string) => Promise<void>;
  createAlbum: (form: FormData) => Promise<Album>;

  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;

  approveArtist: (userId: string) => Promise<void>;
  rejectArtist: (userId: string, reason: string) => Promise<void>;
  createTicket: (subject: string, body: string) => Promise<{ ok: boolean; error?: string }>;
  replyTicket: (ticketId: string, body: string) => Promise<void>;
  setTicketStatus: (ticketId: string, status: TicketStatus) => Promise<void>;
  settlePayout: (payoutId: string) => Promise<void>;
  updatePrices: (prices: SubscriptionPrices) => Promise<void>;
  loadAdminReport: () => Promise<void>;
  loadPayouts: () => Promise<void>;

  initiatePayment: (tier: "silver" | "gold", months: number) => Promise<{ ok: boolean; redirectUrl?: string; error?: string }>;
  verifyPayment: (authority: string, status?: string) => Promise<{ ok: boolean; error?: string }>;

  recordStream: (trackId: string) => Promise<{ ok: boolean; error?: string }>;
}

function errMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

export const useAppStore = create<AppState>()((set, get) => ({
  hydrated: false,
  currentUser: null,
  users: [],
  tracks: [],
  albums: [],
  playlists: [],
  notifications: [],
  tickets: [],
  payouts: [],
  prices: { silver: 99000, gold: 199000 },
  recommendations: [],
  recentPlaylistIds: [],
  adminReport: null,

  setHydrated: (v) => set({ hydrated: v }),
  getCurrentUser: () => get().currentUser,
  getUser: (id) => get().users.find((u) => u.id === id) ?? (get().currentUser?.id === id ? get().currentUser! : undefined),
  getTrack: (id) => get().tracks.find((t) => t.id === id),
  getAlbum: (id) => get().albums.find((a) => a.id === id),

  bootstrap: async () => {
    if (!getToken()) {
      set({ hydrated: true, currentUser: null });
      return;
    }
    try {
      const [rawUser, users, tracks, albums, playlists, notifications, prices] = await Promise.all([
        api.me(),
        api.users(),
        api.tracks(),
        api.albums(),
        api.playlists(),
        api.notifications(),
        api.prices(),
      ]);
      const currentUser: User = {
        ...rawUser,
        settings: rawUser.settings ?? { notificationsEnabled: true, volume: 0.8, language: "fa" },
        followers: rawUser.followers ?? [],
        following: rawUser.following ?? [],
      };
      let tickets: Ticket[] = [];
      let recommendations: Track[] = [];
      try {
        tickets = await api.tickets();
      } catch {
        tickets = [];
      }
      try {
        recommendations = await api.recommendations();
      } catch {
        recommendations = [];
      }
      const recent = playlists.map((p) => p.id).slice(0, 6);
      set({
        currentUser,
        users,
        tracks,
        albums,
        playlists,
        notifications,
        tickets,
        prices,
        recommendations,
        recentPlaylistIds: recent,
        hydrated: true,
      });
    } catch {
      setToken(null);
      set({ currentUser: null, hydrated: true });
    }
  },

  login: async (email, password) => {
    try {
      const data = await api.login(email, password);
      setToken(data.access);
      set({ currentUser: data.user });
      await get().bootstrap();
      return { ok: true, user: get().currentUser ?? data.user };
    } catch (error) {
      return { ok: false, error: errMessage(error, "خطا در ورود") };
    }
  },

  logout: () => {
    setToken(null);
    set({
      currentUser: null,
      users: [],
      tracks: [],
      albums: [],
      playlists: [],
      notifications: [],
      tickets: [],
      payouts: [],
      recommendations: [],
      recentPlaylistIds: [],
      adminReport: null,
    });
  },

  registerListener: async (data) => {
    try {
      const res = await api.registerListener(data);
      setToken(res.access);
      set({ currentUser: res.user });
      await get().bootstrap();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: errMessage(error, "خطا در ثبت‌نام") };
    }
  },

  registerArtist: async (data) => {
    try {
      const res = await api.registerArtist(data);
      setToken(res.access);
      set({ currentUser: res.user });
      await get().bootstrap();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: errMessage(error, "خطا در ثبت‌نام هنرمند") };
    }
  },

  requestPasswordReset: async (email) => {
    try {
      const res = await api.passwordReset(email);
      return { ok: true, message: res.message };
    } catch (error) {
      return { ok: true, message: errMessage(error, "اگر این ایمیل ثبت شده باشد، لینک بازیابی ارسال می‌شود.") };
    }
  },

  updateUser: async (id, patch, avatarFile) => {
    const me = get().currentUser;
    if (!me || me.id !== id) return;
    if (avatarFile) {
      const user = await api.uploadAvatar(avatarFile);
      set({ currentUser: user, users: get().users.map((u) => (u.id === user.id ? user : u)) });
    }
    if (patch.displayName || patch.gender || patch.birthDate) {
      const user = await api.updateMe(patch);
      set({ currentUser: user, users: get().users.map((u) => (u.id === user.id ? user : u)) });
    }
  },

  updateSettings: async (patch) => {
    const user = await api.updateSettings(patch);
    set({ currentUser: user });
  },

  deleteAccount: async () => {
    await api.deleteMe();
    get().logout();
  },

  followUser: async (targetId) => {
    const updated = await api.follow(targetId);
    const me = await api.me();
    set({
      currentUser: me,
      users: get().users.map((u) => (u.id === updated.id ? updated : u.id === me.id ? me : u)),
    });
  },

  unfollowUser: async (targetId) => {
    const updated = await api.unfollow(targetId);
    const me = await api.me();
    set({
      currentUser: me,
      users: get().users.map((u) => (u.id === updated.id ? updated : u.id === me.id ? me : u)),
    });
  },

  createPlaylist: async (name) => {
    try {
      const playlist = await api.createPlaylist(name);
      set((s) => ({
        playlists: [...s.playlists, playlist],
        recentPlaylistIds: [playlist.id, ...s.recentPlaylistIds].slice(0, 10),
      }));
      return { ok: true, playlist };
    } catch (error) {
      return { ok: false, error: errMessage(error, "ساخت پلی‌لیست ناموفق بود.") };
    }
  },

  renamePlaylist: async (id, name) => {
    const playlist = await api.renamePlaylist(id, name);
    set((s) => ({ playlists: s.playlists.map((p) => (p.id === id ? playlist : p)) }));
  },

  deletePlaylist: async (id) => {
    await api.deletePlaylist(id);
    set((s) => ({
      playlists: s.playlists.filter((p) => p.id !== id),
      recentPlaylistIds: s.recentPlaylistIds.filter((x) => x !== id),
    }));
  },

  addTrackToPlaylist: async (playlistId, trackId) => {
    try {
      const playlist = await api.addTrackToPlaylist(playlistId, trackId);
      set((s) => ({ playlists: s.playlists.map((p) => (p.id === playlistId ? playlist : p)) }));
      get().touchRecentPlaylist(playlistId);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: errMessage(error, "افزودن آهنگ ناموفق بود.") };
    }
  },

  removeTrackFromPlaylist: async (playlistId, trackId) => {
    const playlist = await api.removeTrackFromPlaylist(playlistId, trackId);
    set((s) => ({ playlists: s.playlists.map((p) => (p.id === playlistId ? playlist : p)) }));
  },

  touchRecentPlaylist: (id) =>
    set((s) => ({
      recentPlaylistIds: [id, ...s.recentPlaylistIds.filter((x) => x !== id)].slice(0, 10),
    })),

  publishTrack: async (form) => {
    try {
      const track = await api.createTrack(form);
      set((s) => ({ tracks: [track, ...s.tracks] }));
      return { ok: true, track };
    } catch (error) {
      return { ok: false, error: errMessage(error, "انتشار اثر ناموفق بود.") };
    }
  },

  updateTrack: async (id, form) => {
    const track = await api.updateTrack(id, form);
    set((s) => ({ tracks: s.tracks.map((t) => (t.id === id ? track : t)) }));
  },

  deleteTrack: async (id) => {
    await api.deleteTrack(id);
    set((s) => ({ tracks: s.tracks.filter((t) => t.id !== id) }));
  },

  createAlbum: async (form) => {
    const album = await api.createAlbum(form);
    set((s) => ({ albums: [album, ...s.albums] }));
    return album;
  },

  markNotificationRead: async (id) => {
    const notif = await api.markNotificationRead(id);
    set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? notif : n)) }));
  },

  markAllNotificationsRead: async () => {
    await api.markAllNotificationsRead();
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  deleteNotification: async (id) => {
    await api.deleteNotification(id);
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));
  },

  approveArtist: async (userId) => {
    const user = await api.approveArtist(userId);
    set((s) => ({ users: s.users.map((u) => (u.id === userId ? user : u)) }));
  },

  rejectArtist: async (userId, reason) => {
    const user = await api.rejectArtist(userId, reason);
    set((s) => ({ users: s.users.map((u) => (u.id === userId ? user : u)) }));
  },

  createTicket: async (subject, body) => {
    try {
      const ticket = await api.createTicket(subject, body);
      set((s) => ({ tickets: [ticket, ...s.tickets] }));
      return { ok: true };
    } catch (error) {
      return { ok: false, error: errMessage(error, "ارسال تیکت ناموفق بود.") };
    }
  },

  replyTicket: async (ticketId, body) => {
    const ticket = await api.replyTicket(ticketId, body);
    set((s) => ({ tickets: s.tickets.map((t) => (t.id === ticketId ? ticket : t)) }));
  },

  setTicketStatus: async (ticketId, status) => {
    const ticket = await api.setTicketStatus(ticketId, status);
    set((s) => ({ tickets: s.tickets.map((t) => (t.id === ticketId ? ticket : t)) }));
  },

  settlePayout: async (payoutId) => {
    await api.settlePayout(payoutId);
    set((s) => ({
      payouts: s.payouts.map((p) =>
        p.id === payoutId ? { ...p, paymentStatus: "settled" as const } : p
      ),
    }));
  },

  updatePrices: async (prices) => {
    const next = await api.updatePrices(prices);
    set({ prices: next });
  },

  loadAdminReport: async () => {
    const report = await api.adminReport();
    set({
      adminReport: report,
      prices: report.prices,
    });
  },

  loadPayouts: async () => {
    const payouts = await api.payouts();
    set({ payouts });
  },

  initiatePayment: async (tier, months) => {
    try {
      const res = await api.initiatePayment(tier, months);
      return { ok: true, redirectUrl: res.redirectUrl };
    } catch (error) {
      return { ok: false, error: errMessage(error, "شروع پرداخت ناموفق بود.") };
    }
  },

  verifyPayment: async (authority, status = "OK") => {
    try {
      await api.verifyPayment(authority, status);
      await get().bootstrap();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: errMessage(error, "تأیید پرداخت ناموفق بود.") };
    }
  },

  recordStream: async (trackId) => {
    try {
      const res = await api.stream(trackId);
      const me = get().currentUser;
      if (me) {
        set({ currentUser: { ...me, dailyStreamCount: res.dailyStreamCount } });
      }
      set((s) => ({
        tracks: s.tracks.map((t) =>
          t.id === trackId ? { ...t, streams: t.streams + 1 } : t
        ),
      }));
      return { ok: true };
    } catch (error) {
      return { ok: false, error: errMessage(error, "پخش مجاز نیست.") };
    }
  },
}));

export function homePathForRole(role: UserRole): string {
  if (role === "admin" || role === "support") return "/admin/tickets";
  return "/home";
}
