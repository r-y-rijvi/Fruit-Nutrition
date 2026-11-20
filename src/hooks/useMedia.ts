"use client";

import { useSyncExternalStore } from "react";

export function useMedia(query: string, serverValue = false) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

export const useIsWide = () => useMedia("(min-width: 900px)", true);
export const useReducedMotionPref = () => useMedia("(prefers-reduced-motion: reduce)");
export const useFinePointer = () => useMedia("(pointer: fine)");
