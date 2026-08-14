import type {
  Album,
  AppNotification,
  ArtistPayout,
  Playlist,
  SubscriptionPrices,
  Ticket,
  Track,
  User,
} from "./types";
import { todayISO } from "./utils";

const cover = (seed: string) =>
  `https://picsum.photos/seed/${seed}/400/400`;

/** Royalty-free sample tracks for demo playback */
const AUDIO = {
  a: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  b: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  c: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  d: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  e: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
};

const defaultSettings = {
  notificationsEnabled: true,
  volume: 0.8,
  language: "fa" as const,
};

export const DEMO_PASSWORDS = "demo1234";

export function createSeedUsers(): User[] {
  const day = todayISO();
  return [
    {
      id: "user_listener_basic",
      role: "listener",
      displayName: "سارا شنونده",
      username: "sara_basic",
      email: "sara@demo.com",
      password: DEMO_PASSWORDS,
      subscriptionTier: "basic",
      followers: ["user_listener_gold"],
      following: ["user_artist_verified"],
      dailyStreamCount: 12,
      dailyStreamDate: day,
      settings: { ...defaultSettings },
      gender: "female",
      birthDate: "1998-05-12",
      createdAt: "2026-01-01T10:00:00.000Z",
    },
    {
      id: "user_listener_silver",
      role: "listener",
      displayName: "علی نقره‌ای",
      username: "ali_silver",
      email: "ali@demo.com",
      password: DEMO_PASSWORDS,
      avatar: cover("ali"),
      subscriptionTier: "silver",
      subscriptionExpiresAt: "2026-12-01",
      followers: [],
      following: ["user_artist_verified"],
      dailyStreamCount: 40,
      dailyStreamDate: day,
      settings: { ...defaultSettings },
      gender: "male",
      birthDate: "1995-03-20",
      createdAt: "2026-01-02T10:00:00.000Z",
    },
    {
      id: "user_listener_gold",
      role: "listener",
      displayName: "نیما طلایی",
      username: "nima_gold",
      email: "nima@demo.com",
      password: DEMO_PASSWORDS,
      avatar: cover("nima"),
      subscriptionTier: "gold",
      subscriptionExpiresAt: "2027-01-01",
      followers: ["user_listener_basic"],
      following: ["user_artist_verified", "user_artist_pending"],
      dailyStreamCount: 100,
      dailyStreamDate: day,
      settings: { ...defaultSettings },
      gender: "male",
      birthDate: "1992-11-08",
      createdAt: "2026-01-03T10:00:00.000Z",
    },
    {
      id: "user_artist_verified",
      role: "artist",
      displayName: "آوا مهر",
      username: "ava_mehr",
      email: "ava@demo.com",
      password: DEMO_PASSWORDS,
      avatar: cover("ava"),
      subscriptionTier: "gold",
      followers: ["user_listener_basic", "user_listener_silver", "user_listener_gold"],
      following: [],
      dailyStreamCount: 5,
      dailyStreamDate: day,
      settings: { ...defaultSettings },
      artistProfile: {
        bio: "خواننده و آهنگساز مستقل با تمرکز روی پاپ و الکترونیک.",
        verified: true,
        status: "approved",
        sampleWorks: "نمونه‌کارهای منتشرشده روی پلتفرم",
        stageName: "آوا مهر",
      },
      createdAt: "2025-12-01T10:00:00.000Z",
    },
    {
      id: "user_artist_pending",
      role: "artist",
      displayName: "کاوه نوپا",
      username: "kaveh_new",
      email: "kaveh@demo.com",
      password: DEMO_PASSWORDS,
      subscriptionTier: "basic",
      followers: [],
      following: [],
      dailyStreamCount: 0,
      dailyStreamDate: day,
      settings: { ...defaultSettings },
      artistProfile: {
        bio: "هنرمند تازه‌کار در انتظار تأیید.",
        verified: false,
        status: "pending",
        sampleWorks: "لینک دمو / فایل‌های نمونه",
        stageName: "کاوه نوپا",
      },
      createdAt: "2026-07-01T10:00:00.000Z",
    },
    {
      id: "user_support",
      role: "support",
      displayName: "پشتیبان ملودی",
      username: "support1",
      email: "support@demo.com",
      password: DEMO_PASSWORDS,
      subscriptionTier: "gold",
      followers: [],
      following: [],
      dailyStreamCount: 0,
      dailyStreamDate: day,
      settings: { ...defaultSettings },
      createdAt: "2025-11-01T10:00:00.000Z",
    },
    {
      id: "user_admin",
      role: "admin",
      displayName: "مدیر سامانه",
      username: "admin",
      email: "admin@demo.com",
      password: DEMO_PASSWORDS,
      avatar: cover("admin"),
      subscriptionTier: "gold",
      followers: [],
      following: [],
      dailyStreamCount: 0,
      dailyStreamDate: day,
      settings: { ...defaultSettings },
      createdAt: "2025-10-01T10:00:00.000Z",
    },
  ];
}

export function createSeedTracks(): Track[] {
  return [
    {
      id: "track_1",
      title: "سپیده‌دم",
      artistIds: ["user_artist_verified"],
      albumId: "album_1",
      cover: cover("track1"),
      audioUrl: AUDIO.a,
      lyrics: "در سپیده‌دم\nصدای شهر آرام می‌گیرد\nو دل به راه می‌رود",
      genre: "پاپ",
      year: 2025,
      streams: 15200,
      listeners: 4200,
      duration: 372,
      earlyAccess: false,
      isSingle: false,
      createdAt: "2025-06-01T10:00:00.000Z",
    },
    {
      id: "track_2",
      title: "شب‌های تهران",
      artistIds: ["user_artist_verified"],
      albumId: "album_1",
      cover: cover("track2"),
      audioUrl: AUDIO.b,
      lyrics: "شب‌های تهران\nنور نئون و صدای باران",
      genre: "پاپ",
      year: 2025,
      streams: 22100,
      listeners: 6100,
      duration: 401,
      earlyAccess: false,
      isSingle: false,
      createdAt: "2025-06-01T10:00:00.000Z",
    },
    {
      id: "track_3",
      title: "موج آرام",
      artistIds: ["user_artist_verified"],
      albumId: "album_1",
      cover: cover("track3"),
      audioUrl: AUDIO.c,
      genre: "الکترونیک",
      year: 2025,
      streams: 9800,
      listeners: 3000,
      duration: 350,
      earlyAccess: false,
      isSingle: false,
      createdAt: "2025-06-02T10:00:00.000Z",
    },
    {
      id: "track_4",
      title: "تک‌آهنگ طلایی",
      artistIds: ["user_artist_verified"],
      cover: cover("track4"),
      audioUrl: AUDIO.d,
      lyrics: "این تک‌آهنگ زودهنگام است",
      genre: "ایندی",
      year: 2026,
      streams: 1200,
      listeners: 800,
      duration: 310,
      earlyAccess: true,
      isSingle: true,
      createdAt: "2026-07-10T10:00:00.000Z",
    },
    {
      id: "track_5",
      title: "پرواز",
      artistIds: ["user_artist_verified"],
      albumId: "album_2",
      cover: cover("track5"),
      audioUrl: AUDIO.e,
      genre: "راک",
      year: 2024,
      streams: 45000,
      listeners: 12000,
      duration: 290,
      earlyAccess: false,
      isSingle: false,
      createdAt: "2024-09-01T10:00:00.000Z",
    },
  ];
}

export function createSeedAlbums(): Album[] {
  return [
    {
      id: "album_1",
      title: "شهر خاموش",
      artistIds: ["user_artist_verified"],
      cover: cover("album1"),
      year: 2025,
      trackIds: ["track_1", "track_2", "track_3"],
      genre: "پاپ",
      earlyAccess: false,
      createdAt: "2025-06-01T10:00:00.000Z",
    },
    {
      id: "album_2",
      title: "ارتفاع",
      artistIds: ["user_artist_verified"],
      cover: cover("album2"),
      year: 2024,
      trackIds: ["track_5"],
      genre: "راک",
      earlyAccess: false,
      createdAt: "2024-09-01T10:00:00.000Z",
    },
  ];
}

export function createSeedPlaylists(): Playlist[] {
  return [
    {
      id: "pl_1",
      ownerId: "user_listener_basic",
      name: "تمرکز صبح",
      trackIds: ["track_1", "track_3"],
      cover: cover("pl1"),
      createdAt: "2026-02-01T10:00:00.000Z",
      updatedAt: "2026-02-01T10:00:00.000Z",
    },
    {
      id: "pl_2",
      ownerId: "user_listener_gold",
      name: "شب‌گردی",
      trackIds: ["track_2", "track_4", "track_5"],
      cover: cover("pl2"),
      createdAt: "2026-03-01T10:00:00.000Z",
      updatedAt: "2026-03-01T10:00:00.000Z",
    },
  ];
}

export function createSeedNotifications(): AppNotification[] {
  return [
    {
      id: "notif_1",
      userId: "user_listener_basic",
      title: "مهلت اشتراک",
      body: "اشتراک پایه شما رایگان است؛ برای امکانات بیشتر ارتقا دهید.",
      read: false,
      href: "/settings",
      createdAt: "2026-07-20T10:00:00.000Z",
    },
    {
      id: "notif_2",
      userId: "user_listener_gold",
      title: "اثر جدید",
      body: "آوا مهر تک‌آهنگ جدیدی منتشر کرد.",
      read: false,
      href: "/browse",
      createdAt: "2026-07-21T10:00:00.000Z",
    },
    {
      id: "notif_3",
      userId: "user_artist_pending",
      title: "در انتظار تأیید",
      body: "درخواست حساب هنرمندی شما در حال بررسی است.",
      read: true,
      createdAt: "2026-07-01T12:00:00.000Z",
    },
    {
      id: "notif_4",
      userId: "user_support",
      title: "تیکت جدید",
      body: "یک تیکت پشتیبانی جدید ثبت شد.",
      read: false,
      href: "/admin/tickets",
      createdAt: "2026-07-22T08:00:00.000Z",
    },
    {
      id: "notif_5",
      userId: "user_admin",
      title: "درخواست هنرمند",
      body: "کاوه نوپا درخواست تأیید حساب داده است.",
      read: false,
      href: "/admin/artist-requests",
      createdAt: "2026-07-22T09:00:00.000Z",
    },
  ];
}

export function createSeedTickets(): Ticket[] {
  return [
    {
      id: "ticket_1",
      userId: "user_listener_basic",
      subject: "مشکل پخش آهنگ",
      status: "open",
      messages: [
        {
          id: "tm_1",
          senderId: "user_listener_basic",
          body: "بعضی آهنگ‌ها بعد از چند ثانیه قطع می‌شوند.",
          createdAt: "2026-07-22T07:00:00.000Z",
        },
      ],
      createdAt: "2026-07-22T07:00:00.000Z",
    },
    {
      id: "ticket_2",
      userId: "user_listener_silver",
      subject: "سوال درباره دانلود",
      status: "answered",
      messages: [
        {
          id: "tm_2",
          senderId: "user_listener_silver",
          body: "دانلود آهنگ از کجا فعال می‌شود؟",
          createdAt: "2026-07-18T10:00:00.000Z",
        },
        {
          id: "tm_3",
          senderId: "user_support",
          body: "از منوی کارت آهنگ گزینه دانلود را بزنید (اشتراک نقره‌ای و بالاتر).",
          createdAt: "2026-07-18T12:00:00.000Z",
        },
      ],
      createdAt: "2026-07-18T10:00:00.000Z",
    },
  ];
}

export function createSeedPayouts(): ArtistPayout[] {
  return [
    {
      id: "pay_1",
      artistId: "user_artist_verified",
      uniqueListeners: 8200,
      streams: 94000,
      amount: 4500000,
      paymentStatus: "pending",
      month: "2026-07",
    },
  ];
}

export function createSeedPrices(): SubscriptionPrices {
  return { silver: 99000, gold: 199000 };
}

export interface SeedData {
  users: User[];
  tracks: Track[];
  albums: Album[];
  playlists: Playlist[];
  notifications: AppNotification[];
  tickets: Ticket[];
  payouts: ArtistPayout[];
  prices: SubscriptionPrices;
}

export function createFullSeed(): SeedData {
  return {
    users: createSeedUsers(),
    tracks: createSeedTracks(),
    albums: createSeedAlbums(),
    playlists: createSeedPlaylists(),
    notifications: createSeedNotifications(),
    tickets: createSeedTickets(),
    payouts: createSeedPayouts(),
    prices: createSeedPrices(),
  };
}
