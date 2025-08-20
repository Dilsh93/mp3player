"use client";

import { useEffect, useState } from "react";
import { usePlayerStore } from "@/store/playerStore";
import ToggleSwitch from "@/components/ToggleSwitch";

const DEFAULT_BANDS = [0, 0, 0, 0, 0];

export default function EqualizerDialog() {
  const engine = usePlayerStore((s) => s.engine);
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [bass, setBass] = useState(0);
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
    <div className="shrink-0">
      <button
        onClick={() => { setShow(true); requestAnimationFrame(() => setOpen(true)); }}
        className="px-3 py-2 rounded neon-btn"
      >
        Equalizer
      </button>
      {show ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Equalizer">
          <div
            className={`absolute inset-0 bg-black/40 modal-overlay ${open ? "open" : ""}`}
            onClick={() => setOpen(false)}
            onTransitionEnd={() => { if (!open) setShow(false); }}
          />
          <div className={`relative z-10 w-full max-w-xl rounded-2xl border border-black/10 dark:border-white/10 bg-white/75 dark:bg-black/60 backdrop-blur p-5 neon-card modal-panel ${open ? "open" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold neon-text-glow">Equalizer</h2>
              <button onClick={() => setOpen(false)} aria-label="Close" className="px-2 py-1 rounded neon-btn">✕</button>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ToggleSwitch checked={enabled} onChange={setEnabled} label="Enable equalizer" />
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-300">Bass boost & bands match player glow</div>
            </div>
            <div className="mt-4">
              <div className="flex items-end gap-4 overflow-x-auto scroll-modern">
                <div className="text-center text-xs text-neutral-600 dark:text-neutral-300">
                  <div className="mb-2">Bass</div>
                  <div className="vslider">
                    <input aria-label="Bass gain" type="range" min={-12} max={12} step={1} value={bass} onChange={(e) => setBass(Number(e.target.value))} className="vertical-range neon-range" />
                  </div>
                  <div className="mt-1">{bass} dB</div>
                </div>
                {[170,350,1000,3500,10000].map((freq, i) => (
                  <div key={freq} className="text-center text-xs text-neutral-600 dark:text-neutral-300">
                    <div className="mb-2">{freq >= 1000 ? `${freq/1000}k` : freq}Hz</div>
                    <div className="vslider">
                      <input aria-label={`EQ band ${i+1}`} type="range" min={-12} max={12} step={1} value={bands[i] ?? 0} onChange={(e) => updateBand(i, Number(e.target.value))} className="vertical-range neon-range" />
                    </div>
                    <div className="mt-1">{bands[i] ?? 0} dB</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


