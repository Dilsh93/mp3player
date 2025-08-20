"use client";

import { usePlayerStore } from "@/store/playerStore";
import { Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle, Volume2 } from "lucide-react";
import { useMemo, useRef, useState, useEffect } from "react";
import { useLicenseStore } from "@/store/licenseStore";
import { useUserStore } from "@/store/userStore";
import EqualizerDialog from "@/components/EqualizerDialog";

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec <= 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function PlayerControls() {
  const plan = useLicenseStore((s) => s.plan);
  const licenseOwner = useLicenseStore((s) => s.ownerUserId);
  const currentUser = useUserStore((s) => s.userId);
  const isFree = plan === "free";
  const isForeignUser = !!licenseOwner && !!currentUser && licenseOwner !== currentUser;
  const tracks = usePlayerStore((s) => s.tracks);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentTimeSec = usePlayerStore((s) => s.currentTimeSec);
  const durationSec = usePlayerStore((s) => s.durationSec);
  const playPause = usePlayerStore((s) => s.playPause);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const seek = usePlayerStore((s) => s.seek);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const volume01 = usePlayerStore((s) => s.volume01);
  const playbackRate = usePlayerStore((s) => s.playbackRate);
  const setPlaybackRate = usePlayerStore((s) => s.setPlaybackRate);
  const queueMode = usePlayerStore((s) => s.queueMode);
  const setQueueMode = usePlayerStore((s) => s.setQueueMode);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const setRepeatMode = usePlayerStore((s) => s.setRepeatMode);

  const progressPercent = useMemo(() => {
    if (!durationSec) return 0;
    return Math.min(100, Math.max(0, (currentTimeSec / durationSec) * 100));
  }, [currentTimeSec, durationSec]);

  const sliderMax = useMemo(() => Math.max(durationSec || 0, currentTimeSec || 0, 0), [durationSec, currentTimeSec]);
  const sliderValue = useMemo(() => Math.min(currentTimeSec || 0, sliderMax || 0), [currentTimeSec, sliderMax]);
  const volumePercent = useMemo(() => Math.round(Math.max(0, Math.min(1, volume01 || 0)) * 100), [volume01]);
  const [inlineNotice, setInlineNotice] = useState<string | null>(null);

  // Long-press fast seek (rewind/forward) handling
  const holdTimerRef = useRef<number | null>(null);
  const holdIntervalRef = useRef<number | null>(null);
  const holdActiveRef = useRef<boolean>(false);
  const currentTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  useEffect(() => { currentTimeRef.current = currentTimeSec || 0; }, [currentTimeSec]);
  useEffect(() => { durationRef.current = durationSec || 0; }, [durationSec]);

  function startHold(direction: "backward" | "forward") {
    // Start repeating seek every 200ms
    if (holdIntervalRef.current != null) return;
    const stepSeconds = 2; // seek step per tick
    holdIntervalRef.current = window.setInterval(() => {
      const now = currentTimeRef.current;
      const dur = durationRef.current || 0;
      const next = direction === "backward" ? now - stepSeconds : now + stepSeconds;
      const clamped = Math.max(0, Math.min(next, dur || next));
      seek(clamped);
      currentTimeRef.current = clamped;
    }, 200) as unknown as number;
  }

  function stopHold() {
    if (holdIntervalRef.current != null) {
      window.clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    if (holdTimerRef.current != null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    holdActiveRef.current = false;
  }

  function scheduleHold(direction: "backward" | "forward") {
    stopHold();
    holdActiveRef.current = false;
    holdTimerRef.current = window.setTimeout(() => {
      holdActiveRef.current = true;
      startHold(direction);
    }, 300) as unknown as number; // long-press threshold
  }

  function notifyEmptyLibrary(): void {
    setInlineNotice("Library is empty. Import audio files to start playing.");
    setTimeout(() => setInlineNotice(null), 3000);
  }

  return (
    <div className="w-full bg-white/70 dark:bg-black/50 backdrop-blur supports-[backdrop-filter]:bg-white/60 rounded-2xl border border-black/10 dark:border-white/10 p-4 shadow-lg neon-ui">
      {inlineNotice ? (
        <div className="mb-3 text-xs sm:text-sm rounded-md border border-yellow-400/40 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 px-3 py-2">
          {inlineNotice}
        </div>
      ) : null}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <button
            aria-label="Previous"
            onMouseDown={() => scheduleHold("backward")}
            onMouseUp={(e) => { if (holdActiveRef.current) { e.preventDefault(); stopHold(); return; } stopHold(); prev(); }}
            onMouseLeave={stopHold}
            onTouchStart={() => scheduleHold("backward")}
            onTouchEnd={(e) => { if (holdActiveRef.current) { e.preventDefault(); stopHold(); return; } stopHold(); prev(); }}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 neon-btn"
          >
          <SkipBack className="size-5" />
          </button>
          <button aria-label={isPlaying ? "Pause" : "Play"} disabled={isForeignUser} title={isForeignUser ? "This license is owned by another user" : undefined} onClick={() => { if (!tracks || tracks.length === 0) { notifyEmptyLibrary(); return; } playPause(); }} className={`p-3 rounded-full hover:opacity-90 neon-btn ${isForeignUser ? "opacity-50 cursor-not-allowed bg-black text-white dark:bg-white dark:text-black" : "bg-black text-white dark:bg-white dark:text-black"}`}>
          {isPlaying ? <Pause className="size-6" /> : <Play className="size-6" />}
          </button>
          <button
            aria-label="Next"
            onMouseDown={() => scheduleHold("forward")}
            onMouseUp={(e) => { if (holdActiveRef.current) { e.preventDefault(); stopHold(); return; } stopHold(); next(); }}
            onMouseLeave={stopHold}
            onTouchStart={() => scheduleHold("forward")}
            onTouchEnd={(e) => { if (holdActiveRef.current) { e.preventDefault(); stopHold(); return; } stopHold(); next(); }}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 neon-btn"
          >
          <SkipForward className="size-5" />
          </button>
        </div>

        <div className="order-2 lg:order-none lg:ml-auto flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300 w-full min-w-0 flex-nowrap max-w-full">
          <span className="tabular-nums shrink-0">{formatTime(currentTimeSec)}</span>
          <div className="h-1 rounded bg-black/10 dark:bg-white/10 relative flex-1 min-w-[160px] sm:min-w-[260px] lg:min-w-[360px] neon-seek">
            <div className="absolute left-0 top-0 h-full rounded bg-black dark:bg-white neon-fill" style={{ width: `${progressPercent}%` }} />
            <input
              aria-label="Seek"
              type="range"
              min={0}
              max={sliderMax}
              step={0.1}
              value={sliderValue}
              onChange={(e) => seek(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <span className="tabular-nums shrink-0">{formatTime(durationSec)}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:flex lg:flex-wrap lg:items-center gap-3 text-sm">
        <button
          aria-label="Toggle shuffle"
          disabled={isFree}
          onClick={() => {
            if (isFree) return;
            setQueueMode(queueMode === "shuffle" ? "normal" : "shuffle");
          }}
          className={`px-2 py-1 rounded border neon-btn ${queueMode === "shuffle" ? "bg-black text-white dark:bg-white dark:text-black neon-active" : "border-black/10 dark:border-white/10"} ${isFree ? "opacity-50 cursor-not-allowed" : ""}`}
          title={isFree ? "Upgrade to unlock Shuffle" : undefined}
        >
          <Shuffle className="inline size-4 mr-1" />
          Shuffle
        </button>
        <button
          aria-label="Cycle repeat"
          disabled={isFree}
          onClick={() => {
            if (isFree) return;
            setRepeatMode(repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off");
          }}
          className={`px-2 py-1 rounded border neon-btn ${repeatMode !== "off" ? "bg-black text-white dark:bg-white dark:text-black neon-active" : "border-black/10 dark:border-white/10"} ${isFree ? "opacity-50 cursor-not-allowed" : ""}`}
          title={isFree ? "Upgrade to unlock Repeat" : undefined}
        >
          {repeatMode === "one" ? <Repeat1 className="inline size-4 mr-1" /> : <Repeat className="inline size-4 mr-1" />}
          Repeat
        </button>
        <div>
          <EqualizerDialog />
        </div>


        <div className="ml-0 lg:ml-auto flex items-center gap-2 flex-wrap w-full lg:w-auto justify-between lg:justify-end">
          <Volume2 className="size-4" />
          <div className="relative h-1 rounded bg-black/10 dark:bg-white/10 neon-seek w-32 sm:w-40">
            <div className="absolute left-0 top-0 h-full rounded neon-fill" style={{ width: `${volumePercent}%` }} />
            <div className="absolute -top-1.5 h-4 w-4 rounded-full neon-knob" style={{ left: `calc(${volumePercent}% - 8px)` }} />
            <input
              aria-label="Volume"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume01}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <select
            aria-label="Playback rate"
            value={playbackRate}
            onChange={(e) => {
              if (isFree) return;
              setPlaybackRate(Number(e.target.value));
            }}
            disabled={isFree}
            title={isFree ? "Upgrade to change playback speed" : undefined}
            className="ml-2 rounded border border-black/10 dark:border-white/10 bg-transparent px-2 py-1 neon-select"
          >
            {(isFree ? [1] : [0.75, 1, 1.25, 1.5, 1.75, 2]).map((r) => (
              <option key={r} value={r} className="bg-white dark:bg-black">{r}x</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}


