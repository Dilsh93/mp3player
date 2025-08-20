"use client";

import { useEffect, useState } from "react";
import { usePlayerStore } from "@/store/playerStore";

const DEFAULT_BANDS = [0, 0, 0, 0, 0];

export default function Equalizer() {
  const engine = usePlayerStore((s) => s.engine);
  const [enabled, setEnabled] = useState(false);
  const [bass, setBass] = useState(0); // dB
  const [bands, setBands] = useState<number[]>(DEFAULT_BANDS);

  useEffect(() => {
    if (!engine) return;
    engine.configureEqualizer({ enabled, bandGainsDb: bands, bassGainDb: bass });
  }, [engine, enabled, bands, bass]);

  function updateBand(index: number, value: number) {
    const next = bands.slice();
    next[index] = value;
    setBands(next);
  }

  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 neon-card">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Equalizer</div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Enable
        </label>
      </div>
      <div className="mt-3 grid grid-cols-6 gap-3 items-end">
        <div className="text-xs text-neutral-600 dark:text-neutral-300">Bass</div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="text-center text-xs text-neutral-600 dark:text-neutral-300">{[170,350,1_000,3_500,10_000][i]}Hz</div>
        ))}
        <div>
          <input
            aria-label="Bass gain"
            type="range"
            min={-12}
            max={12}
            step={1}
            value={bass}
            onChange={(e) => setBass(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-center text-xs">{bass} dB</div>
        </div>
        {bands.map((v, i) => (
          <div key={i}>
            <input
              aria-label={`EQ band ${i+1}`}
              type="range"
              min={-12}
              max={12}
              step={1}
              value={v}
              onChange={(e) => updateBand(i, Number(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-xs">{v} dB</div>
          </div>
        ))}
      </div>
    </div>
  );
}


