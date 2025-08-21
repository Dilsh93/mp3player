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
  isMuted?: boolean;
  lastVolume01?: number;
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
  volumeStep?: (delta: number) => void;
  toggleMute?: () => void;
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
  isMuted: false,
  lastVolume01: 1,
  playbackRate: 1,
  queueMode: "normal",
  repeatMode: "off",
  engine: null,

  initialize: async () => {
    const tracks = await getAllTracks();

    // Helpers to persist/restore last session
    const saveSession = (trackId: TrackId | null, timeSec: number) => {
      try {
        if (!trackId) return;
        localStorage.setItem(
          "mp3player-session",
          JSON.stringify({ trackId, timeSec: Math.max(0, Math.floor(timeSec || 0)) })
        );
      } catch {}
    };
    const loadSession = (): { trackId: TrackId; timeSec: number } | null => {
      try {
        const raw = localStorage.getItem("mp3player-session");
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.trackId === "string") return { trackId: parsed.trackId, timeSec: Number(parsed.timeSec || 0) };
      } catch {}
      return null;
    };

    const engine = new AudioEngine({
      onTimeUpdate: (t, d) => {
        set({ currentTimeSec: t, durationSec: d });
        // Persist periodically
        saveSession(get().currentTrackId, t);
      },
      onEnded: async () => {
        const idx = pickNextIndex(get());
        if (idx == null) {
          set({ isPlaying: false });
          return;
        }
        const track = get().tracks[idx];
        await get().playTrackById(track.id);
      },
      onPlayStateChange: (playing) => {
        set({ isPlaying: playing });
        if (!playing) saveSession(get().currentTrackId, get().currentTimeSec);
      },
    });
    // Configure Media Session for better Android background handling
    try {
      if ("mediaSession" in navigator) {
        const ms = (navigator as Navigator & { mediaSession?: MediaSession }).mediaSession;
        try {
          const MediaMetadataCtor = (window as Window & { MediaMetadata?: typeof MediaMetadata }).MediaMetadata;
          if (MediaMetadataCtor) {
            ms.metadata = new MediaMetadataCtor({ title: "MP3 Player" });
          }
        } catch {}
        if (typeof ms.setActionHandler === "function") {
          ms.setActionHandler("play", async () => { await get().playPause(); });
          ms.setActionHandler("pause", async () => { await get().playPause(); });
          ms.setActionHandler("previoustrack", async () => { await get().prev(); });
          ms.setActionHandler("nexttrack", async () => { await get().next(); });
          ms.setActionHandler("seekbackward", (details: MediaSessionActionDetails | undefined) => { const s = Math.max(0, (get().currentTimeSec || 0) - ((details && details.seekOffset) || 10)); get().seek(s); });
          ms.setActionHandler("seekforward", (details: MediaSessionActionDetails | undefined) => { const s = Math.min(get().durationSec || 0, (get().currentTimeSec || 0) + ((details && details.seekOffset) || 10)); get().seek(s); });
        }
      }
    } catch {}
    set({ tracks, engine });

    // Restore last session if possible
    const session = loadSession();
    if (session) {
      const found = tracks.find((t) => t.id === session.trackId);
      if (found) {
        const blob = await getTrackBlob(found.id);
        if (blob) {
          await engine.setSource(blob);
          // Seek after metadata is ready
          const audio = engine.getElement();
          const target = Math.max(0, session.timeSec || 0);
          const trySeek = () => {
            try { engine.seek(target); } catch {}
          };
          if (isFinite(audio.duration) && audio.duration > 0) {
            trySeek();
          } else {
            audio.addEventListener("loadedmetadata", trySeek, { once: true });
          }
          set({ currentTrackId: found.id, isPlaying: false, currentTimeSec: target });
        }
      } else {
        // Session refers to a missing track: ensure player is stopped and session cleared
        try { engine.stop(); } catch {}
        try { localStorage.removeItem("mp3player-session"); } catch {}
        // If other tracks exist, select the first one and autoplay
        if (tracks.length > 0) {
          const first = tracks[0];
          set({ currentTrackId: first.id, isPlaying: true, currentTimeSec: 0, durationSec: 0 });
          await get().playTrackById(first.id);
        } else {
          set({ currentTrackId: null, isPlaying: false, currentTimeSec: 0, durationSec: 0 });
        }
      }
    }
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
    set({ volume01: v, isMuted: v === 0 });
  },

  setPlaybackRate: (r: number) => {
    const { engine } = get();
    if (!engine) return;
    engine.setPlaybackRate(r);
    set({ playbackRate: r });
  },

  volumeStep: (delta: number) => {
    const next = Math.max(0, Math.min(1, (get().volume01 || 0) + delta));
    get().setVolume(next);
  },

  toggleMute: () => {
    const s = get();
    if (s.volume01 === 0) {
      const restore = Math.max(0.1, Math.min(1, s.lastVolume01 || 1));
      get().setVolume(restore);
      set({ isMuted: false });
    } else {
      set({ lastVolume01: s.volume01, isMuted: true });
      get().setVolume(0);
    }
  },

  setQueueMode: (m: QueueMode) => set({ queueMode: m }),
  setRepeatMode: (m: "off" | "one" | "all") => set({ repeatMode: m }),

  removeTrack: async (id: TrackId) => {
    const prevTracks = get().tracks;
    await removeTrack(id);
    const remaining = prevTracks.filter((t) => t.id !== id);
    const currentTrackId = get().currentTrackId;
    if (currentTrackId === id) {
      const { engine } = get();
      if (engine) {
        engine.stop();
      }
      try { localStorage.removeItem("mp3player-session"); } catch {}
      // Choose the next track automatically if any remain
      if (remaining.length > 0) {
        const removedIndex = prevTracks.findIndex((t) => t.id === id);
        const nextIndex = removedIndex < remaining.length ? removedIndex : 0;
        const nextTrack = remaining[nextIndex];
        set({ tracks: remaining, currentTrackId: nextTrack.id, isPlaying: true, currentTimeSec: 0, durationSec: 0 });
        // Always continue playback with the next track
        await get().playTrackById(nextTrack.id);
      } else {
        set({ tracks: [], currentTrackId: null, isPlaying: false, currentTimeSec: 0, durationSec: 0 });
      }
      return;
    }
    if (remaining.length === 0) {
      const { engine } = get();
      if (engine) {
        engine.stop();
      }
      try { localStorage.removeItem("mp3player-session"); } catch {}
      set({ tracks: [], currentTrackId: null, isPlaying: false, currentTimeSec: 0, durationSec: 0 });
      return;
    }
    set({ tracks: remaining, currentTrackId });
  },

  clearLibrary: async () => {
    // Lazy import to reduce initial bundle
    const { clearAll } = await import("@/lib/db");
    await clearAll();
    const { engine } = get();
    if (engine) {
      engine.stop();
    }
    try { localStorage.removeItem("mp3player-session"); } catch {}
    set({ tracks: [], currentTrackId: null, isPlaying: false, currentTimeSec: 0, durationSec: 0 });
  },
}));


