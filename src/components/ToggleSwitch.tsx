"use client";

import React from "react";

type ToggleSwitchProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
};

export default function ToggleSwitch({ checked, onChange, disabled, label }: ToggleSwitchProps) {
  function handleClick() {
    if (!disabled) onChange(!checked);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onChange(!checked);
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label || "Toggle"}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors outline-none border
        ${checked ? "bg-[#3498db] border-[#3498db]" : "bg-neutral-400/80 border-neutral-400/80"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`pointer-events-none inline-block h-7 w-7 rounded-full bg-white shadow transition-transform
          ${checked ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}


