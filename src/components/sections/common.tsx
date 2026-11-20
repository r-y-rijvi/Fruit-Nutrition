"use client";

import { LayoutGroup, motion } from "motion/react";
import { FRUITS } from "@/data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const SPRING = { type: "spring" as const, stiffness: 280, damping: 24 };

/** Always visible on mount so Lenis/hash jumps to #nutrition, #pairings, or #sources never leave sections blank. */
export const reveal = {
  initial: { opacity: 1, y: 0 },
  animate: { opacity: 1, y: 0 },
  transition: SPRING,
};

export function SectionHead({ index, eyebrow, title, lede, children }: { index: string; eyebrow: string; title: React.ReactNode; lede?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <motion.header {...reveal} className="flex flex-col gap-6 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between">
      <div className="max-w-[46rem]">
        <p className="flex items-center gap-3 font-mono text-[10.5px] tracking-[0.14em] text-ink/55 uppercase">
          <span className="text-ink">{index}</span>
          <span className="h-px w-8 bg-ink/25" aria-hidden />
          {eyebrow}
        </p>
        <h2 className="mt-4 font-display text-[clamp(30px,4.4vw,58px)] leading-[1.02] font-bold tracking-[-0.035em] text-balance text-ink">{title}</h2>
        {lede && <p className="mt-4 max-w-[58ch] text-[16px] leading-relaxed text-ink/70">{lede}</p>}
      </div>
      {children}
    </motion.header>
  );
}

/** Compact fruit switcher for the long-form sections, so nobody has to scroll back to the dock. */
export function FruitChips({ className, id }: { className?: string; id: string }) {
  const fruitId = useApp((s) => s.fruitId);
  const thumbs = useApp((s) => s.thumbs);
  const setFruit = useApp((s) => s.setFruit);
  return (
    <LayoutGroup id={id}>
      <div role="radiogroup" aria-label="Fruit shown in this section" className={cn("no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 py-1", className)}>
        {FRUITS.map((f) => {
          const on = f.id === fruitId;
          return (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={on}
              data-magnetic
              onClick={() => setFruit(f.id)}
              className={cn(
                "relative flex h-10 shrink-0 items-center gap-1.5 rounded-full pr-3.5 pl-1 text-[13px] font-semibold transition-colors duration-200",
                on ? "on-dark text-white" : "text-ink/70 hover:bg-ink/5 hover:text-ink",
              )}
            >
              {on && <motion.span layoutId={`${id}-bg`} transition={SPRING} className="absolute inset-0 rounded-full bg-ink" />}
              <span className="relative grid size-8 place-items-center">
                {thumbs[f.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumbs[f.id]} alt="" className="size-full object-contain" draggable={false} />
                ) : (
                  <span className="size-5 rounded-full" style={{ background: `radial-gradient(circle at 35% 30%, ${f.palette[3]}, ${f.accent} 55%, ${f.palette[1]})` }} />
                )}
              </span>
              <span className="relative">{f.name}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
