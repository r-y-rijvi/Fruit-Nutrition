"use client";

import { AnimatePresence, LayoutGroup, motion, type Variants } from "motion/react";
import { ArrowUpRight, Shrink, Slice, Sparkles } from "lucide-react";
import { FRUITS, FRUIT_BY_ID } from "@/data";
import { fdcUrl } from "@/data/sources";
import { SHAPES } from "@/components/three/shapes";
import { GlowButton } from "@/components/ui/Glow";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const SPRING = { type: "spring" as const, stiffness: 280, damping: 24 };

const letter: Variants = {
  hidden: { y: "112%", rotate: 6 },
  show: (i: number) => ({ y: "0%", rotate: 0, transition: { ...SPRING, delay: 0.04 + i * 0.035 } }),
  exit: (i: number) => ({ y: "-112%", rotate: -4, transition: { duration: 0.2, ease: [0.7, 0, 0.84, 0], delay: i * 0.012 } }),
};

const fade: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: (d: number = 0) => ({ opacity: 1, y: 0, transition: { ...SPRING, delay: d } }),
  exit: { opacity: 0, y: -6, transition: { duration: 0.16 } },
};

export const shortRole = (role: string) => role.split(/ \/ | & /)[0];

export function HeroTitle({ className }: { className?: string }) {
  const fruitId = useApp((s) => s.fruitId);
  const view = useApp((s) => s.view);
  const fruit = FRUIT_BY_ID[fruitId];
  const index = FRUITS.findIndex((f) => f.id === fruitId) + 1;
  const name = fruit.name.toUpperCase();

  return (
    <div className={cn("text-ink [--col:calc(100vw-40px)] min-[900px]:[--col:min(34vw,440px)]", className)}>
      <AnimatePresence mode="wait">
        <motion.p
          key={`label-${fruitId}`}
          variants={fade}
          initial="hidden"
          animate="show"
          exit="exit"
          className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[10.5px] tracking-[0.12em] text-ink/70 uppercase"
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-[2px] bg-[var(--accent)] ring-1 ring-ink/20" aria-hidden />
            Specimen {String(index).padStart(2, "0")}/{String(FRUITS.length).padStart(2, "0")}
          </span>
          <span className="h-px w-4 bg-ink/30" aria-hidden />
          <a
            href={fdcUrl(fruit.fdcId)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 underline decoration-ink/25 underline-offset-[3px] transition-colors hover:text-ink hover:decoration-ink"
            title={`USDA FoodData Central: ${fruit.fdcDescription}`}
          >
            FDC {fruit.fdcId}
            <ArrowUpRight className="size-3" aria-hidden />
          </a>
          <span className="h-px w-4 bg-ink/30" aria-hidden />
          <span>{SHAPES[fruitId].lifeSize}</span>
        </motion.p>
      </AnimatePresence>

      <h1 aria-label={fruit.name} className="mt-3 font-display leading-[0.92] font-bold tracking-[-0.035em] min-[900px]:mt-4">
        <AnimatePresence mode="wait">
          <motion.span
            key={fruitId}
            initial="hidden"
            animate="show"
            exit="exit"
            aria-hidden
            className="flex"
            style={{ fontSize: `min(104px, calc(var(--col) / ${(name.length * 0.84).toFixed(2)}))` }}
          >
            {name.split("").map((ch, i) => (
              <span key={i} className="-mb-[0.08em] inline-block overflow-hidden pb-[0.08em]">
                <motion.span custom={i} variants={letter} className="inline-block origin-bottom-left">
                  {ch}
                </motion.span>
              </span>
            ))}
          </motion.span>
        </AnimatePresence>
      </h1>

      <AnimatePresence mode="wait">
        <motion.div key={`copy-${fruitId}`} initial="hidden" animate="show" exit="exit">
          <motion.p variants={fade} custom={0.12} className="mt-1.5 font-serif text-[22px] text-ink/80 italic min-[900px]:mt-2 min-[900px]:text-[27px]">
            {fruit.binomial}
          </motion.p>
          <motion.p
            variants={fade}
            custom={0.2}
            className={cn(
              "mt-3 max-w-[36ch] text-[15px] leading-relaxed text-ink/75 min-[900px]:text-[16.5px]",
              view === "layers" && "max-[899px]:hidden",
            )}
          >
            {fruit.tagline}
          </motion.p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function HeroActions({ className }: { className?: string }) {
  const fruitId = useApp((s) => s.fruitId);
  const view = useApp((s) => s.view);
  const busy = useApp((s) => s.busy);
  const activeLayer = useApp((s) => s.activeLayer);
  const setActiveLayer = useApp((s) => s.setActiveLayer);
  const setHoverLayer = useApp((s) => s.setHoverLayer);
  const explode = useApp((s) => s.explode);
  const reassemble = useApp((s) => s.reassemble);
  const setCopilotOpen = useApp((s) => s.setCopilotOpen);
  const fruit = FRUIT_BY_ID[fruitId];
  const layers = view === "layers";

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center gap-2.5">
        <GlowButton
          onClick={layers ? reassemble : explode}
          disabled={busy}
          aria-label={layers ? `Reassemble the ${fruit.name.toLowerCase()}` : `Slice open the ${fruit.name.toLowerCase()}`}
          className="disabled:cursor-wait"
        >
          {layers ? <Shrink className="size-[18px]" aria-hidden /> : <Slice className="size-[18px]" aria-hidden />}
          {layers ? "Reassemble" : "Slice open"}
        </GlowButton>

        <button
          type="button"
          onClick={() => setCopilotOpen(true)}
          className="inline-flex h-12 items-center gap-2 rounded-full border border-ink/15 bg-paper/85 px-5 text-[14px] font-semibold text-ink shadow-xs backdrop-blur-md transition-colors hover:bg-ink hover:text-white"
        >
          <Sparkles className="size-4 text-tangerine" aria-hidden />
          Ask AI Copilot
        </button>

        <AnimatePresence initial={false}>
          {layers && (
            <motion.div
              key="seg"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0, transition: { ...SPRING, delay: 0.2 } }}
              exit={{ opacity: 0, x: -10, transition: { duration: 0.15 } }}
            >
              <LayoutGroup id="layer-seg">
                <div role="radiogroup" aria-label="Fruit layer" className="flex rounded-full border border-ink/10 bg-paper/70 p-1 backdrop-blur-md">
                  {fruit.layers.map((l, i) => {
                    const on = activeLayer === l.key;
                    return (
                      <button
                        key={l.key}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        data-magnetic
                        onClick={() => setActiveLayer(l.key)}
                        onPointerEnter={() => setHoverLayer(l.key)}
                        onPointerLeave={() => setHoverLayer(null)}
                        onKeyDown={(e) => {
                          const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
                          if (!d) return;
                          e.preventDefault();
                          e.stopPropagation();
                          const next = fruit.layers[(i + d + 3) % 3];
                          setActiveLayer(next.key);
                          (e.currentTarget.parentElement?.children[(i + d + 3) % 3] as HTMLElement | undefined)?.focus();
                        }}
                        tabIndex={on ? 0 : -1}
                        className={cn(
                          "relative h-10 rounded-full px-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors duration-200",
                          on ? "on-dark text-white" : "text-ink/70 hover:text-ink",
                        )}
                      >
                        {on && <motion.span layoutId="seg-bg" transition={SPRING} className="absolute inset-0 rounded-full bg-ink" />}
                        <span className="relative">
                          <span className={cn("mr-1 font-mono text-[10px]", on ? "text-white/55" : "text-ink/40")}>0{i + 1}</span>
                          {shortRole(l.role)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </LayoutGroup>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="font-mono text-[10.5px] tracking-[0.1em] text-ink/60 uppercase max-[899px]:hidden">
        {layers ? "Esc or click empty space to reassemble" : "Drag to rotate · Click fruit to slice · Ask AI Copilot"}
      </p>
    </div>
  );
}
