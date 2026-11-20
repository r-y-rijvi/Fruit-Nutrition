import { EVIDENCE_LABEL } from "@/data/nutrients";
import { SOURCES, SOURCE_NUMBER } from "@/data/sources";
import type { BenefitId, NutrientBlock } from "@/data/types";
import { cn } from "@/lib/utils";

export function SourceRefs({ ids, className }: { ids: string[]; className?: string }) {
  return (
    <span className={cn("inline-flex gap-1", className)}>
      {ids.map((id) => (
        <a
          key={id}
          href={`#src-${id}`}
          title={SOURCES[id]?.label}
          className="rounded px-0.5 underline decoration-current/30 underline-offset-2 hover:decoration-current"
        >
          [{SOURCE_NUMBER[id]}]
        </a>
      ))}
    </span>
  );
}

export function NutrientCard({ block, benefit, className }: { block: NutrientBlock; benefit: BenefitId | null; className?: string }) {
  const lit = benefit !== null && block.tags.includes(benefit);
  return (
    <article data-block className={cn("relative pl-3.5", className)}>
      <span
        aria-hidden
        className={cn(
          "absolute top-1 bottom-1 left-0 w-[2px] rounded-full transition-colors duration-300",
          lit ? "bg-accent" : "bg-white/18",
        )}
      />
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="text-[15px] leading-tight font-bold text-white">{block.title}</h4>
        {block.dv !== undefined && (
          <span className="shrink-0 font-mono text-[10.5px] tracking-tight text-white/85">{block.dv}% DV</span>
        )}
      </div>
      <p className="mt-1 text-[13px] leading-snug text-white/72">{block.benefit}</p>
      <p className="mt-1.5 font-mono text-[9.5px] tracking-tight text-white/45 uppercase">
        {block.amount ? `${block.amount} · ` : ""}
        {EVIDENCE_LABEL[block.evidence]} <SourceRefs ids={block.sources} className="normal-case" />
      </p>
    </article>
  );
}
