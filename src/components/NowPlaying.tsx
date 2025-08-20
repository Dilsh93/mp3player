"use client";

import { usePlayerStore } from "@/store/playerStore";

export default function NowPlaying() {
  const tracks = usePlayerStore((s) => s.tracks);
  const currentTrackId = usePlayerStore((s) => s.currentTrackId);
  const track = tracks.find((t) => t.id === currentTrackId) || tracks[0];
  if (!track) return null;
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-neutral-100 to-white dark:from-neutral-900 dark:to-black border border-black/10 dark:border-white/10 shadow-sm neon-card">
      {track.pictureDataUrl ? (
        <img src={track.pictureDataUrl} alt="Cover" className="size-20 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="size-20 rounded-lg bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 shrink-0" />
      )}
      <div className="min-w-0">
        <div className="text-lg font-semibold truncate">{track.title}</div>
        <div className="text-sm text-neutral-600 dark:text-neutral-300 truncate">{track.artist}{track.album ? ` · ${track.album}` : ""}</div>
      </div>
    </div>
  );
}


