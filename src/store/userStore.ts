"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type UserState = {
  userId: string | null;
  setUserId: (id: string | null) => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userId: null,
      setUserId: (id) => set({ userId: id && id.trim() ? id.trim() : null }),
    }),
    {
      name: "mp3player-user",
      storage: createJSONStorage(() => localStorage),
    }
  )
);


