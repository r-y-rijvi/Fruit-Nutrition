import { ArrowUpRight } from "lucide-react";
import { SOURCE_LIST, SOURCE_NUMBER } from "@/data/sources";
import type { Source } from "@/data/types";
import { SectionHead } from "./common";

const GROUPS: { kind: Source["kind"]; label: string }[] = [
  { kind: "database", label: "Nutrient database" },
  { kind: "factsheet", label: "NIH fact sheets" },
  { kind: "guide", label: "Harvard Nutrition Source" },
  { kind: "study", label: "Studies" },
  { kind: "review", label: "Reviews" },
];

export function Sources() {
  return (
    <section id="sources" className="mx-auto max-w-[1600px] px-5 py-16 min-[900px]:px-10 min-[900px]:py-24 xl:px-16">
      <SectionHead
        index="04"
        eyebrow="Sources"
        title="Where every number comes from"
        lede="Amounts are USDA measurements per 100 g of raw fruit. Benefit lines lean on NIH and Harvard summaries, and research claims are labeled by study type so a lab finding is never dressed up as a clinical result."
      />
      <div className="mt-10 grid gap-x-10 gap-y-10 min-[900px]:mt-14 lg:grid-cols-[220px_minmax(0,1fr)]">
        {GROUPS.map((g) => {
          const items = SOURCE_LIST.filter((s) => s.kind === g.kind);
          if (!items.length) return null;
          return (
            <div key={g.kind} className="contents">
              <h3 className="font-mono text-[10.5px] tracking-[0.12em] text-ink/55 uppercase lg:pt-1">{g.label}</h3>
              <ol className="-mt-6 divide-y divide-ink/8 border-y border-ink/8 lg:mt-0">
                {items.map((s) => (
                  <li
                    key={s.id}
                    id={`src-${s.id}`}
                    className="grid scroll-mt-28 grid-cols-[36px_minmax(0,1fr)] gap-x-3 rounded-lg py-3 transition-colors duration-700 data-[flash]:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)]"
                  >
                    <span className="pt-0.5 font-mono text-[12px] text-ink/45 tabular-nums">[{SOURCE_NUMBER[s.id]}]</span>
                    <p className="text-[14px] leading-relaxed text-ink/80">
                      <a href={s.url} target="_blank" rel="noreferrer" className="font-medium text-ink underline decoration-ink/20 underline-offset-[3px] hover:decoration-ink">
                        {s.label}
                        <ArrowUpRight className="ml-0.5 inline size-3.5 align-[-2px]" aria-hidden />
                      </a>
                      <span className="text-ink/55">
                        {" "}
                        · {s.publisher}
                        {s.year ? `, ${s.year}` : ""}
                      </span>
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="mx-auto max-w-[1600px] px-5 pt-6 pb-12 min-[900px]:px-10 xl:px-16">
      <div className="flex flex-col gap-5 border-t border-ink/10 pt-8 min-[900px]:flex-row min-[900px]:items-start min-[900px]:justify-between">
        <p className="max-w-[70ch] text-[13px] leading-relaxed text-ink/60">
          <b className="font-semibold text-ink/80">Educational use only, not medical advice.</b> Values are per 100 g of raw fruit from USDA FoodData Central (SR Legacy) and
          vary by cultivar, ripeness and growing conditions. Peel and seed figures come from the cited research and are not label claims. Talk to a clinician before changing
          your diet for a health condition, especially if you take blood thinners or have a latex allergy.
        </p>
        <p className="shrink-0 font-mono text-[10.5px] tracking-[0.1em] text-ink/45 uppercase">FruitAnatomy 3D · {SOURCE_LIST.length} sources</p>
      </div>
    </footer>
  );
}
