import type { BenefitId, Fruit, MicroKey, NutrientBlock } from "./types";
import { avocado, kiwi, mango, orange } from "./fruits-a";
import { apple, blueberry, papaya, pomegranate } from "./fruits-b";
import { BENEFITS, MICROS, dvPercent, formatAmount } from "./nutrients";

export const FRUITS: Fruit[] = [mango, orange, avocado, kiwi, pomegranate, blueberry, apple, papaya];
export const FRUIT_BY_ID: Record<string, Fruit> = Object.fromEntries(FRUITS.map((f) => [f.id, f]));

export function allBlocks(f: Fruit): NutrientBlock[] {
  return [...f.whole, ...f.layers.flatMap((l) => l.nutrients)];
}

export function fruitHasBenefit(f: Fruit, b: BenefitId): boolean {
  return allBlocks(f).some((n) => n.tags.includes(b));
}

export type SearchHit =
  | { type: "fruit"; fruit: Fruit; score: number }
  | { type: "nutrient"; key: string; label: string; ranked: { fruit: Fruit; detail: string }[]; score: number }
  | { type: "benefit"; id: BenefitId; label: string; fruits: Fruit[]; score: number };

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9+ ]/g, " ").replace(/\s+/g, " ").trim();

function matchScore(query: string, candidates: string[]): number {
  let best = 0;
  for (const raw of candidates) {
    const c = norm(raw);
    if (!c) continue;
    if (c === query) best = Math.max(best, 100);
    else if (c.startsWith(query)) best = Math.max(best, 80 - Math.min(20, c.length - query.length));
    else if (c.split(" ").some((w) => w.startsWith(query))) best = Math.max(best, 60);
    else if (query.length >= 3 && c.includes(query)) best = Math.max(best, 40);
    else if (query.length >= 4 && query.includes(c) && c.length >= 3) best = Math.max(best, 35);
  }
  return best;
}

/** Nutrients that are only described qualitatively (no USDA amount), searchable by name. */
const PHYTO: { key: string; label: string; aliases: string[] }[] = [
  { key: "anthocyanins", label: "Anthocyanins", aliases: ["anthocyanins", "anthocyanin"] },
  { key: "polyphenols", label: "Polyphenols", aliases: ["polyphenols", "antioxidants", "flavonoids"] },
  { key: "quercetin", label: "Quercetin", aliases: ["quercetin"] },
  { key: "hesperidin", label: "Hesperidin", aliases: ["hesperidin", "flavanones"] },
  { key: "fiber", label: "Dietary fiber", aliases: ["fiber", "fibre", "dietary fiber", "roughage"] },
  { key: "pectin", label: "Pectin", aliases: ["pectin", "soluble fiber"] },
  { key: "enzyme", label: "Digestive enzymes", aliases: ["enzyme", "actinidin", "papain", "protease"] },
  { key: "omega-3", label: "Plant omega-3 (ALA)", aliases: ["omega-3", "omega 3", "ala", "alpha-linolenic acid"] },
];

function blocksMatching(f: Fruit, aliases: string[]): NutrientBlock[] {
  const set = new Set(aliases.map(norm));
  return allBlocks(f).filter((b) => b.nutrients.some((n) => set.has(norm(n))));
}

export function search(rawQuery: string): SearchHit[] {
  const q = norm(rawQuery);
  if (!q) return [];
  const hits: SearchHit[] = [];

  for (const fruit of FRUITS) {
    const s = matchScore(q, [fruit.name, fruit.binomial, fruit.id]);
    if (s) hits.push({ type: "fruit", fruit, score: s + 5 });
  }

  for (const [key, meta] of Object.entries(MICROS) as [MicroKey, (typeof MICROS)[MicroKey]][]) {
    const s = matchScore(q, [meta.label, ...meta.aliases]);
    if (!s) continue;
    const ranked = FRUITS.flatMap((fruit) => {
      const m = fruit.micros.find((x) => x.key === key);
      if (!m || m.amount <= 0) return [];
      const dv = dvPercent(key, m.amount);
      return [{ fruit, amount: m.amount, detail: `${formatAmount(m.amount, meta.unit)}${dv !== undefined ? ` · ${dv}% DV` : ""}` }];
    }).sort((a, b) => b.amount - a.amount);
    if (ranked.length) hits.push({ type: "nutrient", key, label: meta.label, ranked, score: s });
  }

  for (const p of PHYTO) {
    const s = matchScore(q, [p.label, ...p.aliases]);
    if (!s) continue;
    const ranked = FRUITS.flatMap((fruit) => {
      if (p.key === "fiber") return [{ fruit, amount: fruit.macros.fiber, detail: `${fruit.macros.fiber} g · ${Math.round((fruit.macros.fiber / 28) * 100)}% DV` }];
      const found = blocksMatching(fruit, p.aliases);
      if (!found.length) return [];
      const layer = fruit.layers.find((l) => l.nutrients.some((n) => found.includes(n)));
      return [{ fruit, amount: found.length, detail: layer ? `In the ${layer.role.toLowerCase()}` : "Whole fruit" }];
    }).sort((a, b) => b.amount - a.amount);
    if (ranked.length) hits.push({ type: "nutrient", key: p.key, label: p.label, ranked, score: s });
  }

  for (const b of BENEFITS) {
    const s = matchScore(q, [b.label, ...b.aliases]);
    if (!s) continue;
    const fruits = FRUITS.filter((f) => fruitHasBenefit(f, b.id));
    if (fruits.length) hits.push({ type: "benefit", id: b.id, label: b.label, fruits, score: s });
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, 8);
}
