"use client";

import { useState } from "react";
import { generateLicenseKey } from "@/lib/licenseKey";

export default function KeygenPage() {
  const [key, setKey] = useState<string>("");

  function onGenerate() {
    setKey(generateLicenseKey());
  }

  function onCopy() {
    if (!key) return;
    navigator.clipboard.writeText(key).catch(() => {});
  }

  return (
    <div className="min-h-screen font-sans bg-gradient-to-br from-white to-neutral-100 dark:from-black dark:to-neutral-900 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">License Key Generator</h1>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 neon-card space-y-3">
          <div className="text-sm text-neutral-600 dark:text-neutral-300">Format: xxxxx-xxxxx-xxxxx-xxxxx-xxxxx</div>
          <div className="flex gap-2">
            <input
              value={key}
              readOnly
              placeholder="Press Generate"
              className="flex-1 px-3 py-2 rounded bg-transparent border border-black/10 dark:border-white/10"
            />
            <button onClick={onGenerate} className="px-3 py-2 rounded neon-btn">Generate</button>
            <button onClick={onCopy} disabled={!key} className="px-3 py-2 rounded neon-btn disabled:opacity-50">Copy</button>
          </div>
        </div>
      </div>
    </div>
  );
}


