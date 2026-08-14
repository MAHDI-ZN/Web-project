import { apiFetch, setToken, unwrapList } from "./client";
import type {
  Album,
  AppNotification,
  ArtistPayout,
  Playlist,
  SubscriptionPrices,
  Ticket,
  Track,
  User,
  UserSettings,
} from "@/lib/types";

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export const api = {
  login: (email: string, password: string) =>
    apiFetch<AuthResponse>("/api/auth/login/", { method: "POST", json: { email, password } }),

  registerListener: (body: {
    displayName: string;
    email: string;
    password: string;
    birthDate: string;
    gender: User["gender"];
  }) => apiFetch<AuthResponse>("/api/auth/register/", { method: "POST", json: body }),

  registerArtist: (body: {
    email: string;
    password: string;
    stageName: string;
    sampleWorks: string;
  }) => apiFetch<AuthResponse>("/api/auth/register-artist/", { method: "POST", json: body }),

  me: () => apiFetch<User>("/api/auth/me/"),
  updateMe: (body: Partial<Pick<User, "displayName" | "gender" | "birthDate">> & { bio?: string }) =>
    apiFetch<User>("/api/auth/me/", { method: "PATCH", json: body }),
  deleteMe: () => apiFetch<void>("/api/auth/me/", { method: "DELETE" }),
  updateSettings: (body: Partial<UserSettings>) =>
    apiFetch<User>("/api/auth/me/settings/", { method: "PATCH", json: body }),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    return apiFetch<User>("/api/auth/me/avatar/", { method: "POST", form });
  },
  passwordReset: (email: string) =>
    apiFetch<{ message: string }>("/api/auth/password-reset/", { method: "POST", json: { email } }),

  users: async () => unwrapList(await apiFetch<User[] | { results: User[] }>("/api/users/")),
  user: (id: string) => apiFetch<User>(`/api/users/${id}/`),
  follow: (id: string) => apiFetch<User>(`/api/users/${id}/follow/`, { method: "POST" }),
  unfollow: (id: string) => apiFetch<User>(`/api/users/${id}/unfollow/`, { method: "POST" }),

  tracks: async (params = "") =>
    unwrapList(await apiFetch<Track[] | { results: Track[] }>(`/api/tracks/${params}`)),
  track: (id: string) => apiFetch<Track>(`/api/tracks/${id}/`),
  createTrack: (form: FormData) => apiFetch<Track>("/api/tracks/", { method: "POST", form }),
  updateTrack: (id: string, form: FormData) =>
    apiFetch<Track>(`/api/tracks/${id}/`, { method: "PATCH", form }),
  deleteTrack: (id: string) => apiFetch<void>(`/api/tracks/${id}/`, { method: "DELETE" }),
  stream: (id: string) =>
    apiFetch<{ ok: boolean; dailyStreamCount: number }>(`/api/tracks/${id}/stream/`, { method: "POST" }),
  download: (id: string) => apiFetch<Blob | { url: string }>(`/api/tracks/${id}/download/`),

  albums: async (params = "") =>
    unwrapList(await apiFetch<Album[] | { results: Album[] }>(`/api/albums/${params}`)),
  album: (id: string) => apiFetch<Album>(`/api/albums/${id}/`),
  createAlbum: (form: FormData) => apiFetch<Album>("/api/albums/", { method: "POST", form }),

  playlists: async () =>
    unwrapList(await apiFetch<Playlist[] | { results: Playlist[] }>("/api/playlists/")),
  playlist: (id: string) => apiFetch<Playlist>(`/api/playlists/${id}/`),
  createPlaylist: (name: string) =>
    apiFetch<Playlist>("/api/playlists/", { method: "POST", json: { name } }),
  renamePlaylist: (id: string, name: string) =>
    apiFetch<Playlist>(`/api/playlists/${id}/`, { method: "PATCH", json: { name } }),
  deletePlaylist: (id: string) => apiFetch<void>(`/api/playlists/${id}/`, { method: "DELETE" }),
  addTrackToPlaylist: (playlistId: string, trackId: string) =>
    apiFetch<Playlist>(`/api/playlists/${playlistId}/tracks/`, {
      method: "POST",
      json: { trackId },
    }),
  removeTrackFromPlaylist: (playlistId: string, trackId: string) =>
    apiFetch<Playlist>(`/api/playlists/${playlistId}/tracks/${trackId}/`, { method: "DELETE" }),

  notifications: async () =>
    unwrapList(
      await apiFetch<AppNotification[] | { results: AppNotification[] }>("/api/notifications/")
    ),
  markNotificationRead: (id: string) =>
    apiFetch<AppNotification>(`/api/notifications/${id}/read/`, { method: "POST" }),
  markAllNotificationsRead: () =>
    apiFetch<{ updated: number }>("/api/notifications/read-all/", { method: "POST" }),
  deleteNotification: (id: string) =>
    apiFetch<void>(`/api/notifications/${id}/`, { method: "DELETE" }),

  tickets: async () =>
    unwrapList(await apiFetch<Ticket[] | { results: Ticket[] }>("/api/tickets/")),
  createTicket: (subject: string, body: string) =>
    apiFetch<Ticket>("/api/tickets/", { method: "POST", json: { subject, body } }),
  replyTicket: (id: string, body: string) =>
    apiFetch<Ticket>(`/api/tickets/${id}/messages/`, { method: "POST", json: { body } }),
  setTicketStatus: (id: string, status: Ticket["status"]) =>
    apiFetch<Ticket>(`/api/tickets/${id}/`, { method: "PATCH", json: { status } }),

  artistRequests: async () =>
    unwrapList(await apiFetch<User[] | { results: User[] }>("/api/artist-requests/")),
  approveArtist: (id: string) =>
    apiFetch<User>(`/api/artist-requests/${id}/approve/`, { method: "POST" }),
  rejectArtist: (id: string, reason: string) =>
    apiFetch<User>(`/api/artist-requests/${id}/reject/`, { method: "POST", json: { reason } }),

  prices: () => apiFetch<SubscriptionPrices>("/api/prices/"),
  updatePrices: (prices: SubscriptionPrices) =>
    apiFetch<SubscriptionPrices>("/api/prices/", { method: "PUT", json: prices }),

  payouts: () => apiFetch<ArtistPayout[]>("/api/payouts/"),
  settlePayout: (id: string) =>
    apiFetch<{ id: string; paymentStatus: string }>(`/api/payouts/${id}/settle/`, { method: "POST" }),

  initiatePayment: (tier: "silver" | "gold", months: number) =>
    apiFetch<{ id: string; amount: number; redirectUrl: string; authority: string }>(
      "/api/payments/initiate/",
      { method: "POST", json: { tier, months } }
    ),
  verifyPayment: (authority: string, status = "OK") =>
    apiFetch<{ status: string; tier?: string; expiresAt?: string }>(
      "/api/payments/verify/",
      { method: "POST", json: { authority, status } }
    ),

  adminReport: () =>
    apiFetch<{
      userCount: number;
      subscriptionDistribution: { basic: number; silver: number; gold: number };
      silverUserCount: number;
      goldUserCount: number;
      monthlyRevenue: number;
      prices: SubscriptionPrices;
      month: string;
    }>("/api/reports/admin/"),
  artistReport: () =>
    apiFetch<{
      month: string;
      tracks: Array<{
        id: string;
        title: string;
        streams: number;
        listeners: number;
        lifetimeStreams: number;
        lifetimeListeners: number;
        revenue: number;
      }>;
      totals: { streams: number; uniqueListeners: number; revenue: number };
    }>("/api/reports/artist/"),
  recommendations: async () =>
    unwrapList(await apiFetch<Track[] | { results: Track[] }>("/api/recommendations/")),
};

export { setToken };
