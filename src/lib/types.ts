export type UserRole = "listener" | "artist" | "support" | "admin";
export type SubscriptionTier = "basic" | "silver" | "gold";
export type ArtistStatus = "pending" | "approved" | "rejected";
export type TicketStatus = "open" | "answered" | "closed";
export type PaymentStatus = "pending" | "settled";
export type RepeatMode = "off" | "all" | "one";
export type Gender = "male" | "female" | "other" | "prefer_not";

export interface UserSettings {
  notificationsEnabled: boolean;
  volume: number;
  language: "fa" | "en";
}

export interface User {
  id: string;
  role: UserRole;
  displayName: string;
  username: string;
  email: string;
  password?: string;
  avatar?: string;
  gender?: Gender;
  birthDate?: string;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt?: string;
  followers: string[];
  following: string[];
  dailyStreamCount: number;
  dailyStreamDate: string;
  settings: UserSettings;
  artistProfile?: ArtistProfile;
  createdAt: string;
}

export interface ArtistProfile {
  bio: string;
  verified: boolean;
  status: ArtistStatus;
  sampleWorks: string;
  rejectionReason?: string;
  stageName: string;
}

export interface Track {
  id: string;
  title: string;
  artistIds: string[];
  albumId?: string;
  cover: string;
  audioUrl: string;
  lyrics?: string;
  genre: string;
  year: number;
  streams: number;
  listeners: number;
  duration: number;
  earlyAccess: boolean;
  isSingle: boolean;
  createdAt: string;
}

export interface Album {
  id: string;
  title: string;
  artistIds: string[];
  cover: string;
  year: number;
  trackIds: string[];
  genre: string;
  earlyAccess: boolean;
  createdAt: string;
}

export interface Playlist {
  id: string;
  ownerId: string;
  name: string;
  trackIds: string[];
  cover?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  href?: string;
  createdAt: string;
}

export interface TicketMessage {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  userId: string;
  userDisplayName?: string;
  subject: string;
  status: TicketStatus;
  messages: TicketMessage[];
  createdAt: string;
}

export interface SubscriptionPrices {
  silver: number;
  gold: number;
}

export interface ArtistPayout {
  id: string;
  artistId: string;
  artistName?: string;
  uniqueListeners: number;
  streams: number;
  amount: number;
  paymentStatus: PaymentStatus;
  month: string;
}
