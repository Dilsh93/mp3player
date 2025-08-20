"use client";

import { useMemo, useState } from "react";
import { usePlayerStore } from "@/store/playerStore";

export default function NowPlaying() {
  const tracks = usePlayerStore((s) => s.tracks);
  const currentTrackId = usePlayerStore((s) => s.currentTrackId);
  const track = tracks.find((t) => t.id === currentTrackId) || tracks[0] || null;
  const metaItems = useMemo(() => {
    if (!track) return [] as string[];
    const items: string[] = [];
    if (track.title) items.push(track.title);
    if (track.artist) items.push(track.artist);
    if (track.album) items.push(track.album);
    if (typeof track.durationSec === "number") {
      const m = Math.floor(track.durationSec / 60);
      const s = String(Math.floor(track.durationSec % 60)).padStart(2, "0");
      items.push(`${m}:${s}`);
    }
    return items;
  }, [track]);

  const [index, setIndex] = useState(0);
  const currentText = metaItems.length > 0 ? metaItems[index % metaItems.length] : "";
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-neutral-100 to-white dark:from-neutral-900 dark:to-black border border-black/10 dark:border-white/10 shadow-sm neon-card">
      {track && track.pictureDataUrl ? (
        <img src={track.pictureDataUrl} alt="Cover" className="size-20 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="size-20 rounded-lg bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 shrink-0" />
      )}
      <div className="min-w-0">
        <div className="text-lg font-semibold truncate">{track && track.title ? track.title : "No track selected"}</div>
        <div className="text-sm text-neutral-600 dark:text-neutral-300 truncate">
          <div
            className={`marquee-once`}
            onAnimationEnd={() => {
              if (metaItems.length > 1) setIndex((i) => (i + 1) % metaItems.length);
            }}
            key={`${currentTrackId}-${index}`}
          >
            <div className="marquee-inner">{currentText}</div>
          </div>
        </div>
      </div>
    </div>
  );
}


