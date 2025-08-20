"use client";

import { useState } from "react";

export default function AboutDialog() {
  const [open, setOpen] = useState(false);

  return (
    <div className="shrink-0">
      <button onClick={() => setOpen(true)} className="px-3 py-2 rounded neon-btn">About</button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="About"
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white/75 dark:bg-black/60 backdrop-blur p-5 neon-card">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold">About</h2>
              <button onClick={() => setOpen(false)} aria-label="Close" className="px-2 py-1 rounded neon-btn">✕</button>
            </div>
            <div className="mt-3 space-y-1 text-sm">
              <div><span className="font-medium">Developer:</span> Supun Dilshan Galagamage</div>
              <div><span className="font-medium">Company:</span> PowerSoft Corporation</div>
            </div>
            <div className="mt-4 rounded-md border border-black/10 dark:border-white/10 overflow-hidden">
              <div className="marquee bg-black/5 dark:bg-white/5 px-3 py-2 text-xs">
                <div className="marquee-inner">
                  Copyright © Supun Dilshan Galagamge, 2025 All rights reserved.
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


