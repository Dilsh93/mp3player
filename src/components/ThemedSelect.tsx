"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Option = { value: string; label: string };

type ThemedSelectProps = {
  value: string;
  onChange: (next: string) => void;
  options: Option[];
  className?: string;
};

export default function ThemedSelect({ value, onChange, options, className }: ThemedSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);

  const currentLabel = useMemo(() => options.find(o => o.value === value)?.label ?? "Select", [options, value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setHighlightIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleToggle() {
    setOpen((o) => {
      const next = !o;
      if (next) {
        const idx = Math.max(0, options.findIndex(o2 => o2.value === value));
        setHighlightIndex(idx);
      }
      return next;
    });
  }

  function commitSelection(idx: number) {
    const opt = options[idx];
    if (!opt) return;
    onChange(opt.value);
    setOpen(false);
    setHighlightIndex(idx);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement | HTMLUListElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      handleToggle();
      return;
    }
    if (!open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(options.length - 1, (i < 0 ? 0 : i + 1)));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(0, (i < 0 ? 0 : i - 1)));
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (highlightIndex >= 0) commitSelection(highlightIndex);
      return;
    }
  }

  return (
    <div ref={containerRef} className={`neon-dropdown ${className ?? ""}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full px-3 py-2 rounded neon-btn flex items-center justify-between"
        onClick={handleToggle}
        onKeyDown={onKeyDown}
      >
        <span>{currentLabel}</span>
        <span aria-hidden className="ml-2 select-arrow" />
      </button>
      {open ? (
        <ul
          role="listbox"
          tabIndex={-1}
          className="neon-dropdown-menu"
          onKeyDown={onKeyDown}
        >
          {options.map((opt, idx) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`neon-dropdown-item ${idx === highlightIndex ? "is-hover" : ""}`}
              onMouseEnter={() => setHighlightIndex(idx)}
              onClick={() => commitSelection(idx)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}


