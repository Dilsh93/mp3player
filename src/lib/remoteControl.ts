"use client";

import { usePlayerStore } from "@/store/playerStore";

type Cleanup = () => void;

function isVisible(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0;
}

function getFocusable(): HTMLElement[] {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-focusable='true'], button, [role='button']"));
  return nodes.filter((n) => isVisible(n) && !n.hasAttribute("disabled"));
}

function center(el: Element): { x: number; y: number } {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function moveFocus(direction: "left" | "right" | "up" | "down"): void {
  const elements = getFocusable();
  if (elements.length === 0) return;
  const active = (document.activeElement as HTMLElement) || elements[0];
  const current = elements.includes(active) ? active : elements[0];
  const c = center(current);

  let best: { el: HTMLElement; score: number } | null = null;
  for (const el of elements) {
    if (el === current) continue;
    const p = center(el);
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    if (direction === "left" && dx >= -1) continue;
    if (direction === "right" && dx <= 1) continue;
    if (direction === "up" && dy >= -1) continue;
    if (direction === "down" && dy <= 1) continue;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    // Prefer elements in the intended direction with minimal distance, penalize orthogonal delta
    const score = Math.hypot(absDx, absDy) + absDy * (direction === "left" || direction === "right" ? 0.75 : 0.0) + absDx * (direction === "up" || direction === "down" ? 0.75 : 0.0);
    if (!best || score < best.score) best = { el: el as HTMLElement, score };
  }
  (best?.el ?? elements[0]).focus();
}

function clickById(id: string): void {
  const el = document.getElementById(id) as HTMLElement | null;
  el?.click();
}

function closeAnyModal(): boolean {
  const overlay = document.querySelector<HTMLElement>(".modal-overlay.open");
  if (overlay) {
    overlay.click();
    return true;
  }
  return false;
}

export function setupRemoteControl(): Cleanup {
  const keyHandler = (e: KeyboardEvent) => {
    const store = usePlayerStore.getState();

    switch (e.key) {
      case "ArrowLeft": e.preventDefault(); return moveFocus("left");
      case "ArrowRight": e.preventDefault(); return moveFocus("right");
      case "ArrowUp": e.preventDefault(); return moveFocus("up");
      case "ArrowDown": e.preventDefault(); return moveFocus("down");
      case "Enter":
      case "NumpadEnter":
        e.preventDefault();
        (document.activeElement as HTMLElement | null)?.click?.();
        return;
      case " ": // Space
      case "MediaPlayPause":
        e.preventDefault();
        store.playPause();
        return;
      case "MediaTrackNext":
      case "PageUp":
      case "ChannelUp":
        e.preventDefault();
        store.next();
        return;
      case "MediaTrackPrevious":
      case "PageDown":
      case "ChannelDown":
        e.preventDefault();
        store.prev();
        return;
      case "VolumeUp":
      case "AudioVolumeUp":
        e.preventDefault();
        store.volumeStep?.(0.05);
        return;
      case "VolumeDown":
      case "AudioVolumeDown":
        e.preventDefault();
        store.volumeStep?.(-0.05);
        return;
      case "VolumeMute":
      case "AudioVolumeMute":
        e.preventDefault();
        store.toggleMute?.();
        return;
      case "Backspace":
      case "Escape":
        if (closeAnyModal()) { e.preventDefault(); }
        return;
      default:
        break;
    }

    // Color keys and shortcuts
    if (e.code === "KeyR") { e.preventDefault(); store.setQueueMode(store.queueMode === "shuffle" ? "normal" : "shuffle"); return; }
    if (e.code === "KeyG") { e.preventDefault(); store.setRepeatMode(store.repeatMode === "off" ? "all" : store.repeatMode === "all" ? "one" : "off"); return; }
    if (e.code === "KeyY" || e.code === "KeyB") { e.preventDefault(); clickById("btn-equalizer"); return; }

    // Number seek 0..90%
    if (/^Digit[0-9]$/.test(e.code)) {
      const n = Number(e.code.replace("Digit", ""));
      const dur = store.durationSec || 0;
      if (dur > 0) {
        e.preventDefault();
        const target = Math.max(0, Math.min(dur, (dur * n) / 10));
        store.seek(target);
      }
    }
  };

  window.addEventListener("keydown", keyHandler);
  return () => window.removeEventListener("keydown", keyHandler);
}


