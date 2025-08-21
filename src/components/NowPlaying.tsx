"use client";

import { useMemo } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { Disc3 } from "lucide-react";

export default function NowPlaying() {
  const tracks = usePlayerStore((s) => s.tracks);
  const currentTrackId = usePlayerStore((s) => s.currentTrackId);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
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


  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-neutral-100 to-white dark:from-neutral-900 dark:to-black border border-black/10 dark:border-white/10 shadow-sm neon-card">
      <div className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24">
        {track && track.pictureDataUrl ? (
          <img 
            src={track.pictureDataUrl} 
            alt="Cover" 
            className="rounded-lg object-cover w-full h-full" 
          />
        ) : (
          <div className="rounded-lg bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 w-full h-full flex items-center justify-center">
            <Disc3 
              className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-neutral-400 dark:text-neutral-500 transition-transform duration-300 ${
                isPlaying ? 'animate-spin-slow' : ''
              }`}
            />
          </div>
        )}
        {/* Overlay spinning disc when playing and has album art */}
        {track && track.pictureDataUrl && isPlaying && (
          <div className="absolute inset-0 rounded-lg bg-black/20 flex items-center justify-center">
            <Disc3 className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white/70 animate-spin-slow" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="text-lg font-semibold truncate">{track && track.title ? track.title : "No track selected"}</div>
        <div className="text-sm text-neutral-600 dark:text-neutral-300">
          {metaItems.length > 1 ? (
            <div className="marquee h-5 w-full" key={currentTrackId}>
              <div className="marquee-inner">
                {metaItems.join(" • ")}
              </div>
            </div>
          ) : (
            <div className="truncate opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
              {metaItems[0] || ""}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


