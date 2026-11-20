"use client";

import { AnimatePresence, motion } from "motion/react";
import { FRUIT_BY_ID } from "@/data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { NutrientCard } from "./NutrientCard";

/** Narrow-screen stand-in for the bracketed callout stack: a swipeable strip of the same nutrient blocks. */
export function MobileCallouts({ className }: { className?: string }) {
  const fruitId = useApp((s) => s.fruitId);
  const view = useApp((s) => s.view);
  const activeLayer = useApp((s) => s.activeLayer);
  const benefit = useApp((s) => s.benefit);
  const busy = useApp((s) => s.busy);
  const fruit = FRUIT_BY_ID[fruitId];
  const layer = view === "layers" ? fruit.layers.find((l) => l.key === activeLayer)! : null;
  const blocks = layer ? layer.nutrients : fruit.whole;
  const key = `${fruitId}-${layer?.key ?? "whole"}`;

  return (
    <section aria-label={layer ? `${layer.role} nutrients` : `${fruit.name} nutrients`} className={cn("on-dark w-full", className)}>
      <AnimatePresence mode="wait" initial={false}>
        {!busy && (
          <motion.ul
            key={key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6, transition: { duration: 0.12 } }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="no-scrollbar flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-5 pb-1"
          >
            {layer && (
              <li className="flex w-[148px] shrink-0 snap-start flex-col justify-between rounded-2xl border border-white/10 bg-ink/70 p-3.5 backdrop-blur-xl">
                <p className="font-mono text-[9.5px] tracking-[0.08em] text-white/55 uppercase">{layer.botanical}</p>
                <p className="text-[15px] leading-tight font-bold text-white">{layer.role}</p>
                <p className="font-mono text-[9.5px] tracking-[0.08em] text-white/55 uppercase">{layer.edible}</p>
              </li>
            )}
            {blocks.map((b) => (
              <li key={b.id} className="w-[78vw] max-w-[300px] shrink-0 snap-start rounded-2xl border border-white/10 bg-ink/70 p-3.5 backdrop-blur-xl">
                <NutrientCard block={b} benefit={benefit} />
              </li>
            ))}
            {layer?.note && (
              <li className="w-[78vw] max-w-[300px] shrink-0 snap-start rounded-2xl border border-white/10 bg-ink/70 p-3.5 text-[12.5px] leading-snug text-white/70 backdrop-blur-xl">
                {layer.note}
              </li>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </section>
  );
}
