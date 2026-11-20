"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { ArrowUpRight, Plus, ScanSearch } from "lucide-react";
import { useId, useState } from "react";
import { FRUITS, FRUIT_BY_ID, allBlocks } from "@/data";
import { FIBER_DV, MICROS, dvPercent, formatAmount } from "@/data/nutrients";
import { fdcUrl } from "@/data/sources";
import type { BenefitId, Fruit, Layer, MicroKey } from "@/data/types";
import { SourceRefs } from "@/components/overlay/NutrientCard";
import { scrollToId } from "@/lib/scroll";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { FruitChips, SPRING, SectionHead, reveal } from "./common";

/** FDA reference values for the Nutrition Facts label (21 CFR 101.9, 2,000 kcal diet). */
const MACRO_DV = { energyKcal: 2000, carbs: 275, fiber: FIBER_DV, protein: 50, fat: 78 };

type Tab = "macro" | "micro";

export function NutritionPanel() {
  const fruitId = useApp((s) => s.fruitId);
  const benefit = useApp((s) => s.benefit);
  const fruit = FRUIT_BY_ID[fruitId];
  const [tab, setTab] = useState<Tab>("macro");
  const uid = useId();

  return (
    <section id="nutrition" aria-labelledby={`${uid}-h`} className="mx-auto max-w-[1600px] px-5 pt-20 pb-16 min-[900px]:px-10 min-[900px]:pt-28 xl:px-16">
      <SectionHead
        index="02"
        eyebrow="Nutrition label"
        title={
          <span id={`${uid}-h`}>
            What 100 g of {fruit.name.toLowerCase()} holds
          </span>
        }
        lede={
          <>
            Measured values from USDA FoodData Central ({fruit.fdcDescription},{" "}
            <a href={fdcUrl(fruit.fdcId)} target="_blank" rel="noreferrer" className="inline-flex items-center font-medium text-ink underline decoration-ink/30 underline-offset-[3px] hover:decoration-ink">
              FDC {fruit.fdcId}
              <ArrowUpRight className="size-3.5" aria-hidden />
            </a>
            ). % Daily Value uses the FDA label reference for adults.
          </>
        }
      >
        <FruitChips id="nutrition-fruits" className="min-[900px]:max-w-[52%]" />
      </SectionHead>

      <div className="mt-10 grid gap-5 min-[900px]:mt-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <motion.div {...reveal} className="rounded-[28px] border border-ink/8 bg-white/80 p-5 shadow-[0_30px_60px_-40px_rgb(18_10_20/0.35)] min-[900px]:p-7">
          <LayoutGroup id={`${uid}-tabs`}>
            <div role="tablist" aria-label="Nutrient type" className="inline-flex rounded-full bg-ink/[0.05] p-1">
              {(["macro", "micro"] as Tab[]).map((t) => {
                const on = tab === t;
                return (
                  <button
                    key={t}
                    id={`${uid}-tab-${t}`}
                    role="tab"
                    type="button"
                    aria-selected={on}
                    aria-controls={`${uid}-panel`}
                    tabIndex={on ? 0 : -1}
                    data-magnetic
                    onClick={() => setTab(t)}
                    onKeyDown={(e) => {
                      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                      const next = t === "macro" ? "micro" : "macro";
                      setTab(next);
                      document.getElementById(`${uid}-tab-${next}`)?.focus();
                    }}
                    className={cn("relative h-10 rounded-full px-5 text-[14px] font-semibold transition-colors", on ? "on-dark text-white" : "text-ink/60 hover:text-ink")}
                  >
                    {on && <motion.span layoutId="tab-bg" transition={SPRING} className="absolute inset-0 rounded-full bg-ink" />}
                    <span className="relative">{t === "macro" ? "Macronutrients" : "Micronutrients"}</span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>

          <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${tab}`} className="mt-6">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }} transition={SPRING}>
                {tab === "macro" ? <Macros fruit={fruit} /> : <Micros fruit={fruit} benefit={benefit} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        <div className="flex min-w-0 flex-col gap-5">
          <LayerTable fruit={fruit} />
          <Cautions key={fruit.id} fruit={fruit} />
        </div>
      </div>
    </section>
  );
}

function Bar({ pct, color = "#120A14", over }: { pct: number; color?: string; over?: boolean }) {
  return (
    <div className="relative h-2 overflow-hidden rounded-full bg-ink/[0.07]">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        whileInView={{ width: `${Math.min(100, Math.max(pct, 1.2))}%` }}
        viewport={{ once: false }}
        transition={SPRING}
      />
      {over && <span className="absolute inset-y-0 right-0 w-1.5 bg-[repeating-linear-gradient(45deg,#fff_0_2px,transparent_2px_4px)] opacity-70" aria-hidden />}
    </div>
  );
}

function Macros({ fruit }: { fruit: Fruit }) {
  const m = fruit.macros;
  const otherCarbs = Math.max(0, m.carbs - m.sugars - m.fiber);
  const rest = Math.max(0, 100 - m.water - m.carbs - m.protein - m.fat);
  const parts = [
    { label: "Water", g: m.water, color: "#9FD3E8" },
    { label: "Sugars", g: m.sugars, color: "#FFB627" },
    { label: "Fiber", g: m.fiber, color: "#2FBF71" },
    { label: "Starch & other carbs", g: otherCarbs, color: "#FF7A1A" },
    { label: "Protein", g: m.protein, color: "#E8247C" },
    { label: "Fat", g: m.fat, color: "#120A14" },
    { label: "Minerals (ash)", g: rest, color: "#B9AEB8" },
  ].filter((p) => p.g > 0.01);
  const rows: { label: string; value: string; dv?: number; pct: number; color: string; indent?: boolean }[] = [
    { label: "Carbohydrate", value: `${m.carbs} g`, dv: pct(m.carbs, MACRO_DV.carbs), pct: (m.carbs / 30) * 100, color: "#FF7A1A" },
    { label: "Sugars (natural)", value: `${m.sugars} g`, pct: (m.sugars / 30) * 100, color: "#FFB627", indent: true },
    { label: "Dietary fiber", value: `${m.fiber} g`, dv: pct(m.fiber, MACRO_DV.fiber), pct: (m.fiber / 30) * 100, color: "#2FBF71", indent: true },
    { label: "Protein", value: `${m.protein} g`, dv: pct(m.protein, MACRO_DV.protein), pct: (m.protein / 30) * 100, color: "#E8247C" },
    { label: "Fat", value: `${m.fat} g`, dv: pct(m.fat, MACRO_DV.fat), pct: (m.fat / 30) * 100, color: "#120A14" },
  ];

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <p className="font-display text-[56px] leading-none font-bold tracking-[-0.04em] text-ink tabular-nums">
          {m.energyKcal}
          <span className="ml-1.5 font-sans text-[16px] font-semibold tracking-normal text-ink/55">kcal</span>
        </p>
        <p className="pb-1 text-right font-mono text-[10.5px] leading-relaxed text-ink/55 uppercase">
          {pct(m.energyKcal, MACRO_DV.energyKcal)}% of 2,000 kcal
          <br />
          per 100 g raw
        </p>
      </div>

      <div className="mt-6">
        <div className="flex h-5 overflow-hidden rounded-md ring-1 ring-ink/10" role="img" aria-label={`Composition of 100 g: ${parts.map((p) => `${p.label} ${p.g.toFixed(1)} g`).join(", ")}`}>
          {parts.map((p) => (
            <motion.span key={p.label} title={`${p.label}: ${p.g.toFixed(2)} g`} className="h-full" style={{ background: p.color }} initial={false} animate={{ width: `${p.g}%` }} transition={SPRING} />
          ))}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {parts.map((p) => (
            <li key={p.label} className="flex items-center gap-1.5 text-[12px] text-ink/70">
              <span className="size-2.5 rounded-[3px] ring-1 ring-ink/10" style={{ background: p.color }} aria-hidden />
              {p.label} <span className="font-mono text-[11px] text-ink/50">{p.g.toFixed(1)} g</span>
            </li>
          ))}
        </ul>
      </div>

      <dl className="mt-7 divide-y divide-ink/8 border-t border-ink/8">
        {rows.map((r) => (
          <div key={r.label} className={cn("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 py-3", r.indent && "pl-5")}>
            <dt className={cn("text-[14.5px] text-ink", r.indent ? "font-medium text-ink/75" : "font-semibold")}>{r.label}</dt>
            <dd className="text-right font-mono text-[12.5px] text-ink tabular-nums">
              {r.value}
              <span className="ml-3 inline-block w-[64px] text-ink/55">{r.dv !== undefined ? `${r.dv}% DV` : "no DV"}</span>
            </dd>
            <div className="col-span-2">
              <Bar pct={r.pct} color={r.color} />
            </div>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[12px] leading-snug text-ink/55">Bars are drawn against 30 g so small amounts stay visible. Sugars here are naturally occurring, not added sugars.</p>
    </div>
  );
}

function pct(v: number, dv: number) {
  return Math.round((v / dv) * 100);
}

const microMax = (key: MicroKey) => Math.max(...FRUITS.map((f) => f.micros.find((m) => m.key === key)?.amount ?? 0));

function Micros({ fruit, benefit }: { fruit: Fruit; benefit: BenefitId | null }) {
  const blocks = allBlocks(fruit);
  const lit = (key: MicroKey) => benefit !== null && blocks.some((b) => b.nutrients.includes(key) && b.tags.includes(benefit));
  const withDv = fruit.micros
    .filter((m) => MICROS[m.key].dv)
    .map((m) => ({ ...m, dv: dvPercent(m.key, m.amount)! }))
    .sort((a, b) => b.dv - a.dv);
  const noDv = fruit.micros.filter((m) => !MICROS[m.key].dv && m.amount > 0);

  return (
    <div>
      <ul className="divide-y divide-ink/8 border-y border-ink/8">
        {withDv.map((m) => (
          <li key={m.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 py-3">
            <span className="flex items-center gap-2 text-[14.5px] font-semibold text-ink">
              {MICROS[m.key].label}
              {lit(m.key) && <span className="rounded-full bg-[var(--accent)] px-1.5 py-px font-mono text-[9px] font-medium text-ink uppercase">Match</span>}
            </span>
            <span className="text-right font-mono text-[12.5px] text-ink tabular-nums">
              {formatAmount(m.amount, MICROS[m.key].unit)}
              <span className="ml-3 inline-block w-[64px] text-ink/55">{m.dv}% DV</span>
            </span>
            <div className="col-span-2">
              <Bar pct={m.dv} over={m.dv > 100} color={m.dv >= 20 ? "#120A14" : m.dv >= 10 ? "rgb(18 10 20 / 0.6)" : "rgb(18 10 20 / 0.32)"} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[12px] leading-snug text-ink/55">
        <b className="font-semibold text-ink/75">20% DV or more</b> is a high source per FDA labeling guidance; 5% or less is low.
      </p>

      {noDv.length > 0 && (
        <div className="mt-7">
          <h3 className="font-mono text-[10.5px] tracking-[0.1em] text-ink/55 uppercase">No Daily Value set</h3>
          <ul className="mt-2 divide-y divide-ink/8 border-y border-ink/8">
            {noDv.map((m) => {
              const max = microMax(m.key);
              return (
                <li key={m.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 py-3">
                  <span className="flex items-center gap-2 text-[14.5px] font-semibold text-ink">
                    {MICROS[m.key].label}
                    {lit(m.key) && <span className="rounded-full bg-[var(--accent)] px-1.5 py-px font-mono text-[9px] font-medium text-ink uppercase">Match</span>}
                  </span>
                  <span className="text-right font-mono text-[12.5px] text-ink tabular-nums">{formatAmount(m.amount, MICROS[m.key].unit)}</span>
                  <div className="col-span-2">
                    <Bar pct={(m.amount / max) * 100} color="linear-gradient(90deg,#FFB627,#FF7A1A,#E8247C)" />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-[12px] leading-snug text-ink/55">These bars compare against the richest of the eight fruits in this guide.</p>
        </div>
      )}
    </div>
  );
}

const EDIBLE_STYLE: Record<Layer["edible"], string> = {
  Eaten: "bg-emerald/15 text-[#13723F]",
  "Edible, often discarded": "bg-mango/25 text-[#7A4C00]",
  "Eat sparingly": "bg-tangerine/20 text-[#8A3A00]",
  "Not eaten": "bg-ink/8 text-ink/65",
};

function LayerTable({ fruit }: { fruit: Fruit }) {
  const inspect = (k: Layer["key"]) => {
    const s = useApp.getState();
    if (s.view === "whole") s.explode();
    s.setActiveLayer(k);
    scrollToId("top");
  };
  return (
    <motion.div {...reveal} className="overflow-hidden rounded-[28px] border border-ink/8 bg-white/80 shadow-[0_30px_60px_-40px_rgb(18_10_20/0.35)]">
      <div className="flex items-center justify-between gap-3 px-5 pt-5 min-[900px]:px-7 min-[900px]:pt-6">
        <h3 className="font-display text-[19px] font-bold tracking-[-0.02em] text-ink">Layer by layer</h3>
        <span className="font-mono text-[10.5px] text-ink/50 uppercase">Outside → in</span>
      </div>
      <ol className="mt-3 divide-y divide-ink/8">
        {fruit.layers.map((l, i) => (
          <li key={l.key} className="group grid grid-cols-[28px_minmax(0,1fr)] gap-x-3 px-5 py-4 min-[900px]:px-7">
            <span className="pt-0.5 font-mono text-[11px] text-ink/40">0{i + 1}</span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <p className="text-[15.5px] font-bold text-ink">{l.role}</p>
                <p className="font-serif text-[16px] text-ink/60 italic">{l.botanical}</p>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", EDIBLE_STYLE[l.edible])}>{l.edible}</span>
              </div>
              <p className="mt-1.5 text-[13.5px] leading-snug text-ink/70">{l.nutrients.map((n) => n.title).join(" · ")}</p>
              <button
                type="button"
                data-magnetic
                onClick={() => inspect(l.key)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full text-[12.5px] font-semibold text-ink/60 underline decoration-ink/20 underline-offset-[3px] transition-colors hover:text-ink hover:decoration-ink"
              >
                <ScanSearch className="size-3.5" aria-hidden />
                Inspect in 3D
              </button>
            </div>
          </li>
        ))}
      </ol>
    </motion.div>
  );
}

function Cautions({ fruit }: { fruit: Fruit }) {
  const [open, setOpen] = useState<number | null>(0);
  const uid = useId();
  return (
    <motion.div {...reveal} className="rounded-[28px] border border-ink/8 bg-white/80 px-5 py-5 shadow-[0_30px_60px_-40px_rgb(18_10_20/0.35)] min-[900px]:px-7 min-[900px]:py-6">
      <h3 className="font-display text-[19px] font-bold tracking-[-0.02em] text-ink">Good to know</h3>
      {fruit.cautions.length === 0 ? (
        <p className="mt-2 text-[14px] text-ink/65">No common safety notes for this fruit beyond ordinary food allergies.</p>
      ) : (
        <ul className="mt-2 divide-y divide-ink/8">
          {fruit.cautions.map((c, i) => {
            const on = open === i;
            return (
              <li key={`${fruit.id}-${c.title}`}>
                <h4>
                  <button
                    type="button"
                    id={`${uid}-b${i}`}
                    aria-expanded={on}
                    aria-controls={`${uid}-p${i}`}
                    onClick={() => setOpen(on ? null : i)}
                    className="flex w-full items-center justify-between gap-4 py-3.5 text-left text-[15px] font-semibold text-ink"
                  >
                    {c.title}
                    <motion.span animate={{ rotate: on ? 45 : 0 }} transition={SPRING} className="grid size-7 shrink-0 place-items-center rounded-full bg-ink/[0.06]">
                      <Plus className="size-4" aria-hidden />
                    </motion.span>
                  </button>
                </h4>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.div
                      id={`${uid}-p${i}`}
                      role="region"
                      aria-labelledby={`${uid}-b${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={SPRING}
                      className="overflow-hidden"
                    >
                      <p className="pb-4 text-[14px] leading-relaxed text-ink/70">
                        {c.body} <SourceRefs ids={c.sources} className="font-mono text-[11px] text-ink/55" />
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
}
