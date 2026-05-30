import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persist, createJSONStorage } from "zustand/middleware";

export const useStore = create(
  persist(
    (set, get) => ({
      savedDates: [],
      isPro: false,

      addDate: (dateData) => {
        const { savedDates, isPro } = get();
        if (!isPro && savedDates.length >= 3) {
          return { error: "PRO_REQUIRED" };
        }

        const newDate = {
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          ...dateData,
        };

        set({ savedDates: [newDate, ...savedDates] });
        return { success: true, id: newDate.id };
      },

      removeDate: (id) => {
        set({ savedDates: get().savedDates.filter((d) => d.id !== id) });
      },

      updateDate: (id, updates) => {
        set({
          savedDates: get().savedDates.map((d) =>
            d.id === id ? { ...d, ...updates } : d,
          ),
        });
      },

      setPro: (status) => set({ isPro: status }),
    }),
    {
      name: "kountdown-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
