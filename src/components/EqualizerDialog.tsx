"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  const [alignTop, setAlignTop] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!engine) return;
    engine.configureEqualizer({ enabled, bandGainsDb: bands, bassGainDb: bass });
  }, [engine, enabled, bands, bass]);

  function updateBand(index: number, value: number) {
    const next = bands.slice();
    next[index] = value;
    setBands(next);
  }

  useEffect(() => {
    if (!show) return;
    function measure() {
      const panel = panelRef.current;
      if (!panel) return;
      const panelHeight = panel.scrollHeight;
      const viewport = window.innerHeight || document.documentElement.clientHeight;
      setAlignTop(panelHeight + 32 > viewport);
    }
    const id = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => { cancelAnimationFrame(id); window.removeEventListener("resize", measure); };
  }, [show]);

  // Compute anchored position above the Equalizer button (fallback below)
  function computePosition() {
    const btn = buttonRef.current;
    const panel = panelRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const viewportW = window.innerWidth || document.documentElement.clientWidth;
    const viewportH = window.innerHeight || document.documentElement.clientHeight;
    const panelW = panel?.offsetWidth || 560;
    const panelH = panel?.offsetHeight || 420;
    const centerX = rect.left + rect.width / 2;
    let left = Math.max(8, Math.min(centerX - panelW / 2, viewportW - panelW - 8));
    let top = rect.top - panelH - 8; // try above
    if (top < 8) {
      top = Math.min(viewportH - panelH - 8, rect.bottom + 8); // fallback below
    }
    setPanelPos({ top, left });
  }

  useLayoutEffect(() => {
    if (!show) return;
    const id = requestAnimationFrame(computePosition);
    window.addEventListener("resize", computePosition);
    window.addEventListener("scroll", computePosition, true);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", computePosition);
      window.removeEventListener("scroll", computePosition, true);
    };
  }, [show]);

  return (
    <div className="shrink-0">
      <button
        ref={buttonRef}
        onClick={() => { setShow(true); requestAnimationFrame(() => setOpen(true)); }}
        className="px-3 py-2 rounded neon-btn"
      >
        Equalizer
      </button>
      {show ? (
        <div className={`fixed inset-0 z-50 p-4`} role="dialog" aria-modal="true" aria-label="Equalizer">
          <div
            className={`absolute inset-0 bg-black/40 modal-overlay ${open ? "open" : ""}`}
            onClick={() => setOpen(false)}
            onTransitionEnd={() => { if (!open) setShow(false); }}
          />
          <div
            ref={panelRef}
            className={`fixed z-10 w-[min(92vw,44rem)] max-w-xl rounded-2xl border border-black/10 dark:border-white/10 bg-white/75 dark:bg-black/60 backdrop-blur p-5 neon-card modal-panel max-h-[calc(100vh-2rem)] overflow-auto ${open ? "open" : ""}`}
            style={panelPos ? { top: panelPos.top, left: panelPos.left } : undefined}
          >
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


