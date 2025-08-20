"use client";

import Importer from "@/components/Importer";
import NowPlaying from "@/components/NowPlaying";
import PlayerControls from "@/components/PlayerControls";
import TrackList from "@/components/TrackList";
import Visualizer from "@/components/Visualizer";
import License from "@/components/License";
import { useEffect } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { useUserStore } from "@/store/userStore";
import { useLicenseStore } from "@/store/licenseStore";
import AboutDialog from "@/components/AboutDialog";

export default function Home() {
  const initialize = usePlayerStore((s) => s.initialize);
  const userId = useUserStore((s) => s.userId);
  const setUserId = useUserStore((s) => s.setUserId);
  const plan = useLicenseStore((s) => s.plan);
  const ownerUserId = useLicenseStore((s) => s.ownerUserId);
  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (userId) return;
    const stored = localStorage.getItem("mp3player-user-id");
    if (stored && stored.trim()) {
      setUserId(stored.trim());
      return;
    }
    // If a license already exists with an owner, adopt it for this device
    if (plan !== "free" && ownerUserId && ownerUserId.trim()) {
      localStorage.setItem("mp3player-user-id", ownerUserId.trim());
      setUserId(ownerUserId.trim());
      return;
    }
    // Otherwise, generate a device-local ID
    const random = typeof crypto !== "undefined" && "getRandomValues" in crypto
      ? Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, "0")).join("")
      : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const generatedId = `device-${random.slice(0, 16)}`;
    localStorage.setItem("mp3player-user-id", generatedId);
    setUserId(generatedId);
  }, [userId, plan, ownerUserId, setUserId]);
  return (
    <div className="min-h-screen font-sans bg-gradient-to-br from-white to-neutral-100 dark:from-black dark:to-neutral-900 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-7xl mx-auto p-6 glass-page rounded-3xl">
        <header className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Next MP3 Player</h1>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 mt-1">Import your audio files and enjoy a modern, beautiful player.</p>
            </div>
            <AboutDialog />
          </div>
        </header>
        <Importer />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 min-w-0">
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur p-4 neon-card max-h-[50vh] md:max-h-[60vh] overflow-auto scroll-modern">
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
