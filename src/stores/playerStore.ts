"use client";

import { create } from "zustand";
import type { RepeatMode, Track } from "@/lib/types";
import { AudioEngine } from "@/lib/audio";
import { useAppStore } from "./appStore";

interface PlayerState {
  queue: Track[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeat: RepeatMode;
  shuffle: boolean;
  expanded: boolean;
  engine: AudioEngine | null;

  initEngine: () => void;
  playTrack: (track: Track, queue?: Track[]) => Promise<void>;
  playAt: (index: number) => Promise<void>;
  togglePlay: () => Promise<void>;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  setRepeat: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  setExpanded: (v: boolean) => void;
  setQueue: (tracks: Track[], startIndex?: number) => Promise<void>;
  removeFromQueue: (index: number) => void;
}

function shuffleIndices(length: number, current: number): number {
  if (length <= 1) return current;
  let next = current;
  while (next === current) {
    next = Math.floor(Math.random() * length);
  }
  return next;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  repeat: "off",
  shuffle: false,
  expanded: false,
  engine: null,

  initEngine: () => {
    if (get().engine || typeof window === "undefined") return;
    const engine = new AudioEngine();
    engine.setVolume(get().volume);
    engine.onTick((currentTime, duration) => {
      set({ currentTime, duration: Number.isFinite(duration) ? duration : 0 });
    });
    engine.onEnded(() => {
      void get().next();
    });
    set({ engine });
  },

  playTrack: async (track, queue) => {
    get().initEngine();
    const q = queue ?? [track];
    const index = Math.max(0, q.findIndex((t) => t.id === track.id));
    await get().setQueue(q, index);
  },

  setQueue: async (tracks, startIndex = 0) => {
    get().initEngine();
    const engine = get().engine;
    if (!engine || tracks.length === 0) return;
    const index = Math.min(Math.max(0, startIndex), tracks.length - 1);
    const track = tracks[index];
    set({ queue: tracks, currentIndex: index });
    await engine.load(track.audioUrl);
    try {
      await engine.play();
      set({ isPlaying: true });
      useAppStore.getState().recordStream(track.id);
    } catch {
      set({ isPlaying: false });
    }
  },

  playAt: async (index) => {
    const { queue, engine } = get();
    if (!engine || index < 0 || index >= queue.length) return;
    const track = queue[index];
    set({ currentIndex: index });
    await engine.load(track.audioUrl);
    try {
      await engine.play();
      set({ isPlaying: true });
      useAppStore.getState().recordStream(track.id);
    } catch {
      set({ isPlaying: false });
    }
  },

  togglePlay: async () => {
    get().initEngine();
    const { engine, isPlaying, queue, currentIndex } = get();
    if (!engine || queue.length === 0 || currentIndex < 0) return;
    if (isPlaying) {
      engine.pause();
      set({ isPlaying: false });
    } else {
      try {
        await engine.play();
        set({ isPlaying: true });
      } catch {
        set({ isPlaying: false });
      }
    }
  },

  next: async () => {
    const { queue, currentIndex, repeat, shuffle } = get();
    if (queue.length === 0) return;
    if (repeat === "one") {
      await get().playAt(currentIndex);
      return;
    }
    let nextIndex = currentIndex + 1;
    if (shuffle) {
      nextIndex = shuffleIndices(queue.length, currentIndex);
    } else if (nextIndex >= queue.length) {
      if (repeat === "all") nextIndex = 0;
      else {
        get().engine?.pause();
        set({ isPlaying: false, currentTime: 0 });
        return;
      }
    }
    await get().playAt(nextIndex);
  },

  prev: async () => {
    const { currentTime, currentIndex, queue } = get();
    if (queue.length === 0) return;
    if (currentTime > 3) {
      get().seek(0);
      return;
    }
    const prevIndex = currentIndex <= 0 ? queue.length - 1 : currentIndex - 1;
    await get().playAt(prevIndex);
  },

  seek: (time) => {
    get().engine?.seek(time);
    set({ currentTime: time });
  },

  setVolume: (v) => {
    get().initEngine();
    get().engine?.setVolume(v);
    set({ volume: v });
    useAppStore.getState().updateSettings({ volume: v });
  },

  setRepeat: (mode) => set({ repeat: mode }),
  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
  setExpanded: (v) => set({ expanded: v }),

  removeFromQueue: (index) => {
    const { queue, currentIndex } = get();
    const nextQueue = queue.filter((_, i) => i !== index);
    let nextIndex = currentIndex;
    if (index < currentIndex) nextIndex -= 1;
    if (index === currentIndex) {
      set({ queue: nextQueue, currentIndex: Math.min(nextIndex, nextQueue.length - 1) });
      if (nextQueue.length) void get().playAt(Math.min(index, nextQueue.length - 1));
      else set({ isPlaying: false, currentIndex: -1 });
      return;
    }
    set({ queue: nextQueue, currentIndex: nextIndex });
  },
}));
