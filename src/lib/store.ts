"use client";

import { create } from "zustand";
import type { BenefitId, LayerKey } from "@/data/types";

export type View = "whole" | "layers";

interface AppState {
  fruitId: string;
  view: View;
  activeLayer: LayerKey;
  hoverLayer: LayerKey | null;
  hoverFruit: boolean;
  benefit: BenefitId | null;
  nutrientFocus: { key: string; label: string } | null;
  busy: boolean;
  thumbs: Record<string, string>;
  heroVisible: boolean;
  copilotOpen: boolean;
  copilotQuery: string | null;
  setFruit: (id: string) => void;
  explode: () => void;
  reassemble: () => void;
  setActiveLayer: (k: LayerKey) => void;
  setHoverLayer: (k: LayerKey | null) => void;
  setHoverFruit: (v: boolean) => void;
  setBenefit: (b: BenefitId | null) => void;
  setNutrientFocus: (n: { key: string; label: string } | null) => void;
  setBusy: (v: boolean) => void;
  setThumb: (id: string, url: string) => void;
  setHeroVisible: (v: boolean) => void;
  setCopilotOpen: (v: boolean) => void;
  setCopilotQuery: (q: string | null) => void;
  askCopilot: (q: string) => void;
}

export const useApp = create<AppState>((set, get) => ({
  fruitId: "mango",
  view: "whole",
  activeLayer: "flesh",
  hoverLayer: null,
  hoverFruit: false,
  benefit: null,
  nutrientFocus: null,
  busy: false,
  thumbs: {},
  heroVisible: true,
  copilotOpen: false,
  copilotQuery: null,
  setFruit: (id) => {
    if (id === get().fruitId) return;
    set({ fruitId: id, view: "whole", activeLayer: "flesh", hoverLayer: null, hoverFruit: false });
  },
  explode: () => {
    if (get().busy || get().view === "layers") return;
    set({ view: "layers", activeLayer: "flesh", hoverFruit: false });
  },
  reassemble: () => {
    if (get().busy || get().view === "whole") return;
    set({ view: "whole", hoverLayer: null });
  },
  setActiveLayer: (k) => set({ activeLayer: k }),
  setHoverLayer: (k) => set({ hoverLayer: k }),
  setHoverFruit: (v) => set({ hoverFruit: v }),
  setBenefit: (b) => set({ benefit: b }),
  setNutrientFocus: (n) => set({ nutrientFocus: n }),
  setBusy: (v) => set({ busy: v }),
  setThumb: (id, url) => set((s) => ({ thumbs: { ...s.thumbs, [id]: url } })),
  setHeroVisible: (v) => set({ heroVisible: v }),
  setCopilotOpen: (v) => set({ copilotOpen: v }),
  setCopilotQuery: (q) => set({ copilotQuery: q }),
  askCopilot: (q) => set({ copilotOpen: true, copilotQuery: q }),
}));

/** Screen-space positions of 3D anchor points, written every frame by the canvas and read by the SVG overlay. */
export interface AnchorPoint {
  x: number;
  y: number;
  visible: boolean;
}

export const anchors: Record<string, AnchorPoint> = {};
const anchorListeners = new Set<() => void>();

export function publishAnchors() {
  anchorListeners.forEach((fn) => fn());
}

export function onAnchors(fn: () => void) {
  anchorListeners.add(fn);
  return () => {
    anchorListeners.delete(fn);
  };
}

/** Pointer-driven spin shared between DOM drag handlers and the render loop. */
export const spin = { angle: 0, velocity: 0, dragging: false };
