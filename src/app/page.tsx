"use client";

import Importer from "@/components/Importer";
import NowPlaying from "@/components/NowPlaying";
import PlayerControls from "@/components/PlayerControls";
import TrackList from "@/components/TrackList";
import Visualizer from "@/components/Visualizer";
import License from "@/components/License";
import { useEffect, useState } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { useUserStore } from "@/store/userStore";
import { useLicenseStore } from "@/store/licenseStore";
import AboutDialog from "@/components/AboutDialog";
 
import { setupRemoteControl } from "@/lib/remoteControl";

export default function Home() {
  const initialize = usePlayerStore((s) => s.initialize);
  const userId = useUserStore((s) => s.userId);
  const setUserId = useUserStore((s) => s.setUserId);
  const plan = useLicenseStore((s) => s.plan);
  const ownerUserId = useLicenseStore((s) => s.ownerUserId);
  const tracks = usePlayerStore((s) => s.tracks);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const [showLicense, setShowLicense] = useState(false);
  
  // Handle escape key to close license modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showLicense) {
        setShowLicense(false);
      }
    };
    
    if (showLicense) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showLicense]);
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Global remote-control keyboard mapping
  useEffect(() => {
    const cleanup = setupRemoteControl();
    return cleanup;
  }, []);

  // Focus a primary control for immediate remote use
  useEffect(() => {
    const id = setTimeout(() => {
      const el = document.getElementById("btn-play") as HTMLElement | null;
      (el ?? document.querySelector<HTMLElement>("[data-focusable='true']"))?.focus?.();
    }, 0);
    return () => clearTimeout(id);
  }, []);

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
      <div className="glass-page w-full min-h-[100svh] p-6">
        <header className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-[var(--neon-ring)] to-[var(--neon-blue)] bg-clip-text text-transparent animate-gradient-x">Next MP3 Player</h1>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 mt-1">Import your audio files and enjoy a modern, beautiful player.</p>
            </div>
            <div className="flex items-center gap-2">
              {plan === "free" && (
                <button
                  onClick={() => setShowLicense(true)}
                  className="text-xs px-3 py-1.5 rounded-lg neon-btn bg-gradient-to-r from-[var(--neon-ring)] to-[var(--neon-blue)] text-black font-medium"
                >
                  Upgrade
                </button>
              )}
              <AboutDialog />
            </div>
          </div>
        </header>
        
        {tracks.length === 0 && <Importer />}
        
        <div className="space-y-6 flex-1">
          {/* Player UI - Always visible when there are tracks */}
          {tracks.length > 0 && (
            <div className="space-y-4">
              <NowPlaying />
              <PlayerControls />
            </div>
          )}
          
          {/* Visualizer - Only show when playing */}
          {isPlaying && tracks.length > 0 && (
            <div className="animate-fade-in-up">
              <Visualizer />
            </div>
          )}
          
          {/* Track List - Below player */}
          {tracks.length > 0 && (
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur p-4 neon-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Your Music</h2>
                <Importer compact />
              </div>
              <div className="max-h-[60vh] overflow-auto scroll-modern">
                <TrackList />
              </div>
            </div>
          )}
        </div>
        
        {/* License Modal */}
        {showLicense && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowLicense(false)}
          >
            <div 
              className="bg-white dark:bg-black rounded-2xl border border-black/10 dark:border-white/10 p-6 max-w-md w-full max-h-[80vh] overflow-auto neon-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Upgrade to Premium</h2>
                <button
                  onClick={() => setShowLicense(false)}
                  className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <License />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
