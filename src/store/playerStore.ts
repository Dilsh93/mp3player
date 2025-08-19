"use client";

import { create } from "zustand";
import { getTrackBlob, getAllTracks, parseAndStoreFiles, removeTrack, type StoredTrack, type TrackId } from "@/lib/db";
import { AudioEngine } from "@/lib/playerEngine";

type QueueMode = "normal" | "shuffle";

type PlayerState = {
  tracks: StoredTrack[];
  currentTrackId: TrackId | null;
  isPlaying: boolean;
  currentTimeSec: number;
  durationSec: number;
  volume01: number;
  playbackRate: number;
  queueMode: QueueMode;
  repeatMode: "off" | "one" | "all";
  engine: AudioEngine | null;
};

type PlayerActions = {
  initialize: () => Promise<void>;
  importFiles: (files: File[]) => Promise<void>;
  playTrackById: (id: TrackId) => Promise<void>;
  playPause: () => Promise<void>;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  setPlaybackRate: (r: number) => void;
  setQueueMode: (m: QueueMode) => void;
  setRepeatMode: (m: "off" | "one" | "all") => void;
  removeTrack: (id: TrackId) => Promise<void>;
  clearLibrary: () => Promise<void>;
};

function pickNextIndex(state: PlayerState): number | null {
  if (state.tracks.length === 0) return null;
  const currentIndex = state.tracks.findIndex((t) => t.id === state.currentTrackId);
  if (state.repeatMode === "one" && currentIndex !== -1) return currentIndex;
  if (state.queueMode === "shuffle") {
    let idx = Math.floor(Math.random() * state.tracks.length);
    if (idx === currentIndex && state.tracks.length > 1) {
      idx = (idx + 1) % state.tracks.length;
    }
    return idx;
  }
  if (currentIndex === -1) return 0;
  if (currentIndex + 1 < state.tracks.length) return currentIndex + 1;
  return state.repeatMode === "all" ? 0 : null;
}

function pickPrevIndex(state: PlayerState): number | null {
  if (state.tracks.length === 0) return null;
  const currentIndex = state.tracks.findIndex((t) => t.id === state.currentTrackId);
  if (state.queueMode === "shuffle") {
    let idx = Math.floor(Math.random() * state.tracks.length);
    if (idx === currentIndex && state.tracks.length > 1) {
      idx = (idx + state.tracks.length - 1) % state.tracks.length;
    }
    return idx;
  }
  if (currentIndex === -1) return 0;
  if (currentIndex - 1 >= 0) return currentIndex - 1;
  return state.repeatMode === "all" ? state.tracks.length - 1 : null;
}

export const usePlayerStore = create<PlayerState & PlayerActions>((set, get) => ({
  tracks: [],
  currentTrackId: null,
  isPlaying: false,
  currentTimeSec: 0,
  durationSec: 0,
  volume01: 1,
  playbackRate: 1,
  queueMode: "normal",
  repeatMode: "off",
  engine: null,

  initialize: async () => {
    const tracks = await getAllTracks();
    const engine = new AudioEngine({
      onTimeUpdate: (t, d) => set({ currentTimeSec: t, durationSec: d }),
      onEnded: async () => {
        const idx = pickNextIndex(get());
        if (idx == null) {
          set({ isPlaying: false });
          return;
        }
        const track = get().tracks[idx];
        await get().playTrackById(track.id);
      },
      onPlayStateChange: (playing) => set({ isPlaying: playing }),
    });
    set({ tracks, engine });
  },

  importFiles: async (files: File[]) => {
    const newTracks = await parseAndStoreFiles(files);
    if (newTracks.length === 0) return;
    const nextTracks = [...newTracks, ...get().tracks];
    set({ tracks: nextTracks });
    // Auto-play the first imported track if nothing is playing
    if (!get().currentTrackId && nextTracks.length > 0) {
      await get().playTrackById(nextTracks[0].id);
    }
  },

  playTrackById: async (id: TrackId) => {
    const { engine } = get();
    if (!engine) return;
    const blob = await getTrackBlob(id);
    if (!blob) return;
    await engine.setSource(blob);
    await engine.play();
    set({ currentTrackId: id, isPlaying: true });
  },

  playPause: async () => {
    const { engine, isPlaying } = get();
    if (!engine) return;
    if (isPlaying) {
      engine.pause();
      set({ isPlaying: false });
    } else {
      await engine.play();
      set({ isPlaying: true });
    }
  },

  next: async () => {
    const idx = pickNextIndex(get());
    if (idx == null) return;
    const track = get().tracks[idx];
    await get().playTrackById(track.id);
  },

  prev: async () => {
    const idx = pickPrevIndex(get());
    if (idx == null) return;
    const track = get().tracks[idx];
    await get().playTrackById(track.id);
  },

  seek: (seconds: number) => {
    const { engine } = get();
    if (!engine) return;
    engine.seek(seconds);
  },

  setVolume: (v: number) => {
    const { engine } = get();
    if (!engine) return;
    engine.setVolume(v);
    set({ volume01: v });
  },

  setPlaybackRate: (r: number) => {
    const { engine } = get();
    if (!engine) return;
    engine.setPlaybackRate(r);
    set({ playbackRate: r });
  },

  setQueueMode: (m: QueueMode) => set({ queueMode: m }),
  setRepeatMode: (m: "off" | "one" | "all") => set({ repeatMode: m }),

  removeTrack: async (id: TrackId) => {
    await removeTrack(id);
    const remaining = get().tracks.filter((t) => t.id !== id);
    let currentTrackId = get().currentTrackId;
    if (currentTrackId === id) currentTrackId = null;
    set({ tracks: remaining, currentTrackId });
  },

  clearLibrary: async () => {
    // Lazy import to reduce initial bundle
    const { clearAll } = await import("@/lib/db");
    await clearAll();
    set({ tracks: [], currentTrackId: null, isPlaying: false, currentTimeSec: 0, durationSec: 0 });
  },
}));


