import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type LicensePlan = "free" | "annual" | "lifetime";

export type LicenseState = {
  plan: LicensePlan;
  licenseKey?: string;
  activatedAt?: number;
  expiresAt?: number;
  activationError?: string;
  activate: (plan: Exclude<LicensePlan, "free">, key: string) => void;
  deactivate: () => void;
  checkExpiration: () => void;
};

function isValidKeyFormat(key: string): boolean {
  return /^[A-Z0-9]{5}(-[A-Z0-9]{5}){4}$/i.test(key.trim());
}

function computeExpiry(activatedAtMs: number, plan: LicensePlan): number | undefined {
  if (plan === "annual") {
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
    return activatedAtMs + oneYearMs;
  }
  return undefined;
}

export const useLicenseStore = create<LicenseState>()(
  persist(
    (set, get) => ({
      plan: "free",
      licenseKey: undefined,
      activatedAt: undefined,
      expiresAt: undefined,
      activationError: undefined,
      activate: (plan, key) => {
        const trimmed = key.trim().toUpperCase();
        if (!isValidKeyFormat(trimmed)) {
          set({ activationError: "Invalid license format. Use xxxxx-xxxxx-xxxxx-xxxxx-xxxxx" });
          return;
        }
        const now = Date.now();
        set({
          plan,
          licenseKey: trimmed,
          activatedAt: now,
          expiresAt: computeExpiry(now, plan),
          activationError: undefined,
        });
      },
      deactivate: () => {
        set({ plan: "free", licenseKey: undefined, activatedAt: undefined, expiresAt: undefined, activationError: undefined });
      },
      checkExpiration: () => {
        const { plan, expiresAt } = get();
        if (plan === "annual" && typeof expiresAt === "number" && Date.now() > expiresAt) {
          set({ plan: "free", licenseKey: undefined, activatedAt: undefined, expiresAt: undefined, activationError: undefined });
        }
      },
    }),
    {
      name: "mp3player-license",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ plan: state.plan, licenseKey: state.licenseKey, activatedAt: state.activatedAt, expiresAt: state.expiresAt }),
    }
  )
);


