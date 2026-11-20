"use client";

import { AnimatePresence, LayoutGroup, motion, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import { X } from "lucide-react";
import { useMemo, useRef } from "react";
import { FRUITS, fruitHasBenefit, search } from "@/data";
import { BENEFITS } from "@/data/nutrients";
import type { BenefitId, Fruit } from "@/data/types";
import { useFinePointer } from "@/hooks/useMedia";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Magnetic } from "@/components/ui/Glow";

const SPRING = { type: "spring" as const, stiffness: 280, damping: 24 };

export function BenefitPills({ className }: { className?: string }) {
  const benefit = useApp((s) => s.benefit);
  const setBenefit = useApp((s) => s.setBenefit);
  const items: { id: BenefitId | null; label: string }[] = [{ id: null, label: "All benefits" }, ...BENEFITS];
  return (
    <LayoutGroup id="pills">
      <div role="toolbar" aria-label="Filter by health benefit" className={cn("no-scrollbar flex gap-1.5 overflow-x-auto", className)}>
        {items.map((b) => {
          const on = benefit === b.id;
          return (
            <Magnetic key={b.label} strength={0.3} className="shrink-0">
              <button
                type="button"
                data-magnetic
                aria-pressed={on}
                onClick={() => setBenefit(on ? null : b.id)}
                className={cn(
                  "relative h-9 rounded-full border px-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors duration-200",
                  on ? "on-dark border-transparent text-white" : "border-ink/10 bg-paper/55 text-ink/80 backdrop-blur-md hover:bg-paper/85",
                )}
              >
                {on && <motion.span layoutId="pill-bg" transition={SPRING} className="absolute inset-0 -z-0 rounded-full bg-ink" />}
                <span className="relative">{b.label}</span>
              </button>
            </Magnetic>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

function useRanking() {
  const focus = useApp((s) => s.nutrientFocus);
  const benefit = useApp((s) => s.benefit);
  return useMemo(() => {
    const detail = new Map<string, string>();
    let order: Fruit[] = FRUITS;
    if (focus) {
      const hit = search(focus.label).find((h) => h.type === "nutrient" && h.key === focus.key);
      if (hit && hit.type === "nutrient") {
        hit.ranked.forEach((r) => detail.set(r.fruit.id, r.detail));
        const rank = new Map(hit.ranked.map((r, i) => [r.fruit.id, i]));
        order = [...FRUITS].sort((a, b) => (rank.get(a.id) ?? 99) - (rank.get(b.id) ?? 99));
      }
    }
    const match = new Set(FRUITS.filter((f) => !benefit || fruitHasBenefit(f, benefit)).map((f) => f.id));
    if (benefit) order = [...order].sort((a, b) => Number(match.has(b.id)) - Number(match.has(a.id)));
    return { order, detail, match };
  }, [focus, benefit]);
}

export function FruitDock({ className }: { className?: string }) {
  const fruitId = useApp((s) => s.fruitId);
  const thumbs = useApp((s) => s.thumbs);
  const focus = useApp((s) => s.nutrientFocus);
  const setFocus = useApp((s) => s.setNutrientFocus);
  const setFruit = useApp((s) => s.setFruit);
  const fine = useFinePointer();
  const mouseX = useMotionValue(Infinity);
  const { order, detail, match } = useRanking();

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <AnimatePresence>
        {focus && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={SPRING}
            className="on-dark flex items-center gap-2 rounded-full bg-ink/85 py-1 pr-1 pl-3 text-[12px] font-medium text-white backdrop-blur-md"
          >
            Ranked by {focus.label}, per 100 g
            <button type="button" aria-label="Clear ranking" onClick={() => setFocus(null)} className="grid size-6 place-items-center rounded-full hover:bg-white/15">
              <X className="size-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <nav
        aria-label="Choose a fruit"
        onPointerMove={(e) => fine && mouseX.set(e.clientX)}
        onPointerLeave={() => mouseX.set(Infinity)}
        className="no-scrollbar flex max-w-full items-end gap-1.5 overflow-x-auto rounded-[26px] border border-white/40 bg-paper/35 px-2.5 pt-2 pb-1.5 shadow-[0_20px_50px_-20px_rgb(18_10_20/0.55)] backdrop-blur-2xl"
      >
        <LayoutGroup id="dock">
          {order.map((f) => (
            <DockItem
              key={f.id}
              fruit={f}
              thumb={thumbs[f.id]}
              active={f.id === fruitId}
              dim={!match.has(f.id)}
              detail={focus ? (detail.get(f.id) ?? "—") : undefined}
              mouseX={mouseX}
              magnify={fine}
              onSelect={() => setFruit(f.id)}
            />
          ))}
        </LayoutGroup>
      </nav>
    </div>
  );
}

function DockItem({
  fruit, thumb, active, dim, detail, mouseX, magnify, onSelect,
}: {
  fruit: Fruit; thumb?: string; active: boolean; dim: boolean; detail?: string; mouseX: MotionValue<number>; magnify: boolean; onSelect: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const dist = useTransform(mouseX, (x) => {
    const r = ref.current?.getBoundingClientRect();
    return r ? x - (r.left + r.width / 2) : Infinity;
  });
  const size = useSpring(useTransform(dist, [-150, 0, 150], [56, magnify ? 78 : 56, 56]), SPRING);
  const rx = useSpring(0, SPRING);
  const ry = useSpring(0, SPRING);

  return (
    <motion.button
      ref={ref}
      layout
      transition={SPRING}
      type="button"
      aria-pressed={active}
      aria-label={`${fruit.name}${detail ? `, ${detail}` : ""}`}
      onClick={onSelect}
      onPointerMove={(e) => {
        if (!magnify) return;
        const r = e.currentTarget.getBoundingClientRect();
        ry.set(((e.clientX - r.left) / r.width - 0.5) * 24);
        rx.set(-((e.clientY - r.top) / r.height - 0.5) * 24);
      }}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
      className={cn("group relative flex shrink-0 flex-col items-center rounded-2xl px-1 transition-opacity duration-300", dim && "opacity-35")}
      style={{ perspective: 400 }}
    >
      <motion.span className="relative grid place-items-center" style={{ width: size, height: size, rotateX: rx, rotateY: ry }}>
        <span
          aria-hidden
          className={cn("absolute inset-[8%] rounded-full transition-colors duration-300", active ? "bg-ink/80" : "bg-ink/0 group-hover:bg-ink/25")}
        />
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" draggable={false} className="relative size-full object-contain drop-shadow-[0_6px_8px_rgb(18_10_20/0.35)]" />
        ) : (
          <span className="relative size-[62%] rounded-full" style={{ background: `radial-gradient(circle at 35% 30%, ${fruit.palette[3]}, ${fruit.accent} 55%, ${fruit.palette[1]})` }} />
        )}
      </motion.span>
      <span className={cn("mt-0.5 text-[10.5px] font-semibold whitespace-nowrap", active ? "text-ink" : "text-ink/70")}>{fruit.name}</span>
      {detail && <span className="font-mono text-[8.5px] whitespace-nowrap text-ink/60">{detail}</span>}
      {active && <motion.span layoutId="dock-active" transition={SPRING} className="mt-0.5 h-[3px] w-4 rounded-full bg-ink" />}
      {!active && <span className="mt-0.5 h-[3px] w-4" />}
    </motion.button>
  );
}
