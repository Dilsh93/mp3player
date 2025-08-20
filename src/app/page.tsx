"use client";

import Importer from "@/components/Importer";
import NowPlaying from "@/components/NowPlaying";
import PlayerControls from "@/components/PlayerControls";
import TrackList from "@/components/TrackList";
import Visualizer from "@/components/Visualizer";
import License from "@/components/License";
import { useEffect } from "react";
import { usePlayerStore } from "@/store/playerStore";

export default function Home() {
  const initialize = usePlayerStore((s) => s.initialize);
  useEffect(() => {
    initialize();
  }, [initialize]);
  return (
    <div className="min-h-screen font-sans bg-gradient-to-br from-white to-neutral-100 dark:from-black dark:to-neutral-900 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-10">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Next MP3 Player</h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 mt-1">Import your audio files and enjoy a modern, beautiful player.</p>
        </header>
        <Importer />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6">
          <div className="lg:col-span-2 order-2 lg:order-none min-w-0">
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur p-3 sm:p-4 neon-card">
              <TrackList />
            </div>
          </div>
          <div className="space-y-4">
            <Visualizer />
            <License />
            <NowPlaying />
            <PlayerControls />
          </div>
        </div>
      </div>
    </div>
  );
}
