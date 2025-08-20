"use client";

import { useState, useEffect } from "react";
import { useLicenseStore, LicensePlan } from "@/store/licenseStore";
import { useUserStore } from "@/store/userStore";

export default function License() {
  const plan = useLicenseStore((s) => s.plan);
  const expiresAt = useLicenseStore((s) => s.expiresAt);
  const activatedAt = useLicenseStore((s) => s.activatedAt);
  const ownerUserId = useLicenseStore((s) => s.ownerUserId);
  const activationError = useLicenseStore((s) => s.activationError);
  const activate = useLicenseStore((s) => s.activate);
  const deactivate = useLicenseStore((s) => s.deactivate);
  const checkExpiration = useLicenseStore((s) => s.checkExpiration);
  const currentUserId = useUserStore((s) => s.userId);
  const setUserId = useUserStore((s) => s.setUserId);

  const [key, setKey] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<Exclude<LicensePlan, "free">>("annual");

  useEffect(() => {
    checkExpiration();
  }, [checkExpiration]);

  function onActivate() {
    activate(selectedPlan, key, currentUserId);
  }

  const isActive = plan !== "free";

  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 neon-card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm text-neutral-600 dark:text-neutral-300">License</div>
          <div className="text-base font-semibold capitalize">{isActive ? plan : "free"}</div>
          {plan === "annual" && typeof expiresAt === "number" ? (
            <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
              Renews on {new Date(expiresAt).toLocaleDateString()} {new Date(expiresAt).toLocaleTimeString()}
            </div>
          ) : null}
          {plan === "lifetime" && typeof activatedAt === "number" ? (
            <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">Lifetime license (no renewal)</div>
          ) : null}
        </div>
        {isActive ? (
          <button onClick={deactivate} className="px-3 py-2 text-sm rounded neon-btn">Deactivate</button>
        ) : null}
      </div>
      {!isActive ? (
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-4 gap-3">
          <input
            value={currentUserId ?? ""}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter user ID/email"
            className="px-3 py-2 rounded bg-transparent border border-black/10 dark:border-white/10"
          />
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxxxx"
            className="lg:col-span-2 px-3 py-2 rounded bg-transparent border border-black/10 dark:border-white/10"
          />
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value as Exclude<LicensePlan, "free">)}
            className="px-3 py-2 rounded bg-transparent border border-black/10 dark:border-white/10 neon-select"
          >
            <option value="annual">Annual</option>
            <option value="lifetime">Lifetime</option>
          </select>
          <button onClick={onActivate} className="px-3 py-2 rounded font-medium neon-btn"><span>Activate</span></button>
        </div>
      ) : null}
      {isActive ? (
        <div className="mt-3 text-xs text-neutral-600 dark:text-neutral-400">
          Owner: {ownerUserId ?? "-"} {currentUserId && ownerUserId && currentUserId !== ownerUserId ? "(different user: read-only)" : ""}
        </div>
      ) : null}
      {activationError ? (
        <div className="mt-2 text-sm text-red-500">{activationError}</div>
      ) : null}
    </div>
  );
}


