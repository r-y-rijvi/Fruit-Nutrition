import type { BenefitId, MicroKey, NutrientBlock, Evidence } from "./types";

interface MicroMeta {
  label: string;
  unit: "mg" | "µg" | "g";
  /** FDA Daily Value for adults and children 4+ (21 CFR 101.9); undefined when no DV exists. */
  dv?: number;
  aliases: string[];
}

export const MICROS: Record<MicroKey, MicroMeta> = {
  vitC: { label: "Vitamin C", unit: "mg", dv: 90, aliases: ["vitamin c", "vit c", "ascorbic acid", "ascorbate"] },
  vitA: { label: "Vitamin A (RAE)", unit: "µg", dv: 900, aliases: ["vitamin a", "vit a", "retinol"] },
  betaCarotene: { label: "Beta-carotene", unit: "µg", aliases: ["beta-carotene", "beta carotene", "carotene", "carotenoids"] },
  vitE: { label: "Vitamin E", unit: "mg", dv: 15, aliases: ["vitamin e", "vit e", "tocopherol"] },
  vitK: { label: "Vitamin K", unit: "µg", dv: 120, aliases: ["vitamin k", "vit k", "phylloquinone"] },
  folate: { label: "Folate", unit: "µg", dv: 400, aliases: ["folate", "folic acid", "vitamin b9", "b9"] },
  b6: { label: "Vitamin B6", unit: "mg", dv: 1.7, aliases: ["vitamin b6", "b6", "pyridoxine"] },
  pantothenic: { label: "Pantothenic acid", unit: "mg", dv: 5, aliases: ["pantothenic acid", "vitamin b5", "b5"] },
  potassium: { label: "Potassium", unit: "mg", dv: 4700, aliases: ["potassium", "k"] },
  magnesium: { label: "Magnesium", unit: "mg", dv: 420, aliases: ["magnesium", "mg"] },
  calcium: { label: "Calcium", unit: "mg", dv: 1300, aliases: ["calcium", "ca"] },
  copper: { label: "Copper", unit: "mg", dv: 0.9, aliases: ["copper", "cu"] },
  manganese: { label: "Manganese", unit: "mg", dv: 2.3, aliases: ["manganese", "mn"] },
  lutein: { label: "Lutein + zeaxanthin", unit: "µg", aliases: ["lutein", "zeaxanthin", "eye carotenoids"] },
  lycopene: { label: "Lycopene", unit: "µg", aliases: ["lycopene"] },
  mufa: { label: "Monounsaturated fat", unit: "g", aliases: ["monounsaturated fat", "mufa", "oleic acid", "healthy fats", "good fats"] },
};

export const FIBER_DV = 28;

export function dvPercent(key: MicroKey, amount: number): number | undefined {
  const dv = MICROS[key].dv;
  return dv ? Math.round((amount / dv) * 100) : undefined;
}

export function formatAmount(amount: number, unit: string): string {
  return `${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${unit}`;
}

/** Builds a callout block from a measured USDA value so %DV is always derived, never typed by hand. */
export function usdaBlock(
  key: MicroKey,
  amount: number,
  opts: { id?: string; title?: string; benefit: string; tags: BenefitId[]; sources?: string[] },
): NutrientBlock {
  const meta = MICROS[key];
  return {
    id: opts.id ?? key,
    title: opts.title ?? meta.label,
    benefit: opts.benefit,
    amount: formatAmount(amount, meta.unit),
    dv: dvPercent(key, amount),
    nutrients: [key, ...meta.aliases],
    tags: opts.tags,
    evidence: "usda",
    sources: ["usda-sr", ...(opts.sources ?? [])],
  };
}

export function fiberBlock(amount: number, benefit: string, sources: string[] = []): NutrientBlock {
  return {
    id: "fiber",
    title: "Dietary fiber",
    benefit,
    amount: formatAmount(amount, "g"),
    dv: Math.round((amount / FIBER_DV) * 100),
    nutrients: ["fiber", "dietary fiber", "roughage", "pectin"],
    tags: ["digestion", "heart"],
    evidence: "usda",
    sources: ["usda-sr", "hsph-fiber", ...sources],
  };
}

export function researchBlock(
  id: string,
  title: string,
  benefit: string,
  nutrients: string[],
  tags: BenefitId[],
  evidence: Exclude<Evidence, "usda">,
  sources: string[],
): NutrientBlock {
  return { id, title, benefit, nutrients, tags, evidence, sources };
}

export const BENEFITS: { id: BenefitId; label: string; aliases: string[] }[] = [
  { id: "immunity", label: "Immunity", aliases: ["immunity", "immune", "immune system", "cold", "infection"] },
  { id: "skin", label: "Skin health", aliases: ["skin", "skin health", "collagen", "wound healing", "glow"] },
  { id: "brain", label: "Brain & cognition", aliases: ["brain", "cognition", "memory", "cognitive", "focus"] },
  { id: "digestion", label: "Digestion", aliases: ["digestion", "gut", "gut health", "constipation", "microbiome", "bowel"] },
  { id: "bone", label: "Bone health", aliases: ["bone", "bones", "bone growth", "bone health", "osteoporosis"] },
  { id: "heart", label: "Heart health", aliases: ["heart", "heart health", "blood pressure", "cholesterol", "cardiovascular"] },
  { id: "vision", label: "Vision", aliases: ["vision", "eyes", "eye health", "macular", "sight"] },
];

export const EVIDENCE_LABEL: Record<Evidence, string> = {
  usda: "USDA measured",
  clinical: "Clinical trial",
  observational: "Cohort study",
  lab: "Lab research",
};
