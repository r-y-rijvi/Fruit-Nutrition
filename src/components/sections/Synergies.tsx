"use client";

import { LayoutGroup, motion } from "motion/react";
import { Plus, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { FRUIT_BY_ID } from "@/data";
import { BENEFITS } from "@/data/nutrients";
import { SYNERGIES } from "@/data/synergies";
import type { Synergy } from "@/data/types";
import { SourceRefs } from "@/components/overlay/NutrientCard";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { SPRING, SectionHead } from "./common";

const STRENGTH: Record<Synergy["strength"], { chip: string; note: string }> = {
  Strong: { chip: "bg-emerald/15 text-[#13723F]", note: "Controlled human trials" },
  Moderate: { chip: "bg-mango/25 text-[#7A4C00]", note: "Plausible, some human data" },
  Emerging: { chip: "bg-ink/8 text-ink/70", note: "Mechanism shown, outcomes unproven" },
  Caution: { chip: "bg-magenta/12 text-[#A3104F]", note: "Interaction to be aware of" },
};

const BENEFIT_LABEL = Object.fromEntries(BENEFITS.map((b) => [b.id, b.label]));

export function Synergies() {
  const fruitId = useApp((s) => s.fruitId);
  const benefit = useApp((s) => s.benefit);
  const fruit = FRUIT_BY_ID[fruitId];
  const [only, setOnly] = useState(false);

  const list = useMemo(() => {
    const score = (s: Synergy) => (s.fruitIds.includes(fruitId) ? 2 : 0) + (benefit && s.tags.includes(benefit) ? 1 : 0);
    const sorted = [...SYNERGIES].sort((a, b) => score(b) - score(a));
    return only ? sorted.filter((s) => s.fruitIds.includes(fruitId)) : sorted;
  }, [fruitId, benefit, only]);

  return (
    <section id="pairings" className="mx-auto max-w-[1600px] px-5 py-16 min-[900px]:px-10 min-[900px]:py-24 xl:px-16">
      <SectionHead
        index="03"
        eyebrow="Food pairings"
        title="Eat it with something"
        lede="Some nutrients work better together. Each pairing is graded by the strength of the human evidence behind it, and the cautions are included on purpose."
      >
        <LayoutGroup id="pair-filter">
          <div role="radiogroup" aria-label="Which pairings to show" className="inline-flex shrink-0 rounded-full bg-ink/[0.05] p-1">
            {[
              { v: false, label: "All pairings" },
              { v: true, label: `With ${fruit.name.toLowerCase()}` },
            ].map((o) => {
              const on = only === o.v;
              return (
                <button
                  key={String(o.v)}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  data-magnetic
                  onClick={() => setOnly(o.v)}
                  className={cn("relative h-10 rounded-full px-4 text-[13.5px] font-semibold whitespace-nowrap transition-colors", on ? "on-dark text-white" : "text-ink/60 hover:text-ink")}
                >
                  {on && <motion.span layoutId="pair-bg" transition={SPRING} className="absolute inset-0 rounded-full bg-ink" />}
                  <span className="relative">{o.label}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      </SectionHead>

      {list.length === 0 ? (
        <p className="mt-12 rounded-[28px] border border-dashed border-ink/15 p-8 text-center text-[15px] text-ink/65">
          No graded pairings for {fruit.name.toLowerCase()} yet. Switch to <b>All pairings</b> to see the rest.
        </p>
      ) : (
        <ul className="mt-10 grid gap-5 min-[900px]:mt-14 lg:grid-cols-2">
          {list.map((s) => (
            <PairCard key={s.id} s={s} fits={s.fruitIds.includes(fruitId) ? fruit.name : null} lit={!!benefit && s.tags.includes(benefit)} />
          ))}
        </ul>
      )}
    </section>
  );
}

function PairCard({ s, fits, lit }: { s: Synergy; fits: string | null; lit: boolean }) {
  const caution = s.strength === "Caution";
  const Join = caution ? TriangleAlert : Plus;
  return (
    <motion.li
      layout
      transition={SPRING}
      className={cn(
        "relative overflow-hidden rounded-[28px] border bg-white/80 p-5 shadow-[0_30px_60px_-40px_rgb(18_10_20/0.35)] min-[900px]:p-6",
        lit ? "border-ink/40" : "border-ink/8",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("rounded-full px-2.5 py-1 text-[11.5px] font-bold", STRENGTH[s.strength].chip)}>{s.strength}</span>
        <span className="text-[12px] text-ink/55">{STRENGTH[s.strength].note}</span>
        <span className="ml-auto flex flex-wrap gap-1.5">
          {fits && <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 font-mono text-[9.5px] font-medium text-ink uppercase">Fits {fits}</span>}
          {s.tags.map((t) => (
            <span key={t} className={cn("rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase", lit ? "border-ink/30 text-ink/80" : "border-ink/10 text-ink/50")}>
              {BENEFIT_LABEL[t]}
            </span>
          ))}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch">
        <motion.div
          initial={{ x: -48, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={SPRING}
          className="rounded-2xl bg-[color-mix(in_oklab,var(--accent)_22%,white)] p-4 pr-5"
        >
          <p className="font-mono text-[9.5px] tracking-[0.08em] text-ink/55 uppercase">Fruit side</p>
          <p className="mt-1.5 text-[16px] leading-tight font-bold text-ink">{s.fruitSide.nutrient}</p>
          <p className="mt-1 text-[13px] leading-snug text-ink/65">{s.fruitSide.label}</p>
        </motion.div>
        <motion.span
          initial={{ scale: 0, rotate: -90 }}
          whileInView={{ scale: 1, rotate: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ ...SPRING, delay: 0.18 }}
          className="z-10 -mx-2.5 grid place-items-center self-center"
        >
          <span className={cn("on-dark grid size-9 place-items-center rounded-full text-white ring-4 ring-white", caution ? "bg-magenta" : "bg-ink")}>
            <Join className="size-4" aria-hidden />
          </span>
        </motion.span>
        <motion.div
          initial={{ x: 48, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={SPRING}
          className="rounded-2xl bg-ink/[0.05] p-4 pl-5"
        >
          <p className="font-mono text-[9.5px] tracking-[0.08em] text-ink/55 uppercase">{caution ? "Watch with" : "Pair with"}</p>
          <p className="mt-1.5 text-[16px] leading-tight font-bold text-ink">{s.partner.nutrient}</p>
          <p className="mt-1 text-[13px] leading-snug text-ink/65">{s.partner.label}</p>
        </motion.div>
      </div>

      <p className="mt-5 font-display text-[19px] leading-snug font-bold tracking-[-0.02em] text-ink">
        <span className="mr-1.5 text-ink/35" aria-hidden>
          =
        </span>
        {s.outcome}
      </p>
      <p className="mt-1.5 text-[14px] leading-relaxed text-ink/70">
        {s.mechanism} <SourceRefs ids={s.sources} className="font-mono text-[11px] text-ink/55" />
      </p>
    </motion.li>
  );
}
