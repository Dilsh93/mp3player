"use client";

import { usePlayerStore } from "@/store/playerStore";
import { Trash2 } from "lucide-react";

export default function TrackList() {
  const tracks = usePlayerStore((s) => s.tracks);
  const currentTrackId = usePlayerStore((s) => s.currentTrackId);
  const playTrackById = usePlayerStore((s) => s.playTrackById);
  const removeTrack = usePlayerStore((s) => s.removeTrack);
  if (tracks.length === 0) {
    return (
      <div className="text-center text-sm text-neutral-600 dark:text-neutral-300">
        Your library is empty. Drag and drop audio files here or use the importer.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-black/5 dark:divide-white/10">
      {tracks.map((t) => (
        <li key={t.id} className={`flex items-center gap-3 py-3 px-2 rounded-lg neon-list-item ${currentTrackId === t.id ? "bg-black/5 dark:bg-white/10" : ""}`}>
          <button onClick={() => playTrackById(t.id)} className="flex items-center gap-3 flex-1 text-left min-w-0" data-focusable="true">
            {t.pictureDataUrl ? (
              <img src={t.pictureDataUrl} alt="Cover" className="size-12 rounded object-cover shrink-0" />
            ) : (
              <div className="size-12 rounded bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 shrink-0" />
            )}
            <div className="min-w-0">
              <div className="font-medium truncate">{t.title}</div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400 truncate">{t.artist}{t.album ? ` · ${t.album}` : ""}</div>
            </div>
          </button>
          <div className="text-xs tabular-nums text-neutral-600 dark:text-neutral-400 w-12 sm:w-16 text-right shrink-0">
            {typeof t.durationSec === "number" ? `${Math.floor((t.durationSec || 0) / 60)}:${String(Math.floor((t.durationSec || 0) % 60)).padStart(2, "0")}` : "--:--"}
          </div>
          <button aria-label="Remove" onClick={() => removeTrack(t.id)} className="p-2 rounded hover:bg-black/5 dark:hover:bg-white/10 shrink-0 neon-btn" data-focusable="true">
            <Trash2 className="size-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}


