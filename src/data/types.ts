export type BenefitId = "immunity" | "skin" | "brain" | "digestion" | "bone" | "heart" | "vision";

/** usda = measured value from FoodData Central; others describe the strongest supporting study type. */
export type Evidence = "usda" | "clinical" | "observational" | "lab";

export type LayerKey = "peel" | "flesh" | "core";

export type MicroKey =
  | "vitC" | "vitA" | "vitE" | "vitK" | "folate" | "b6" | "pantothenic"
  | "potassium" | "magnesium" | "calcium" | "copper" | "manganese"
  | "lutein" | "lycopene" | "betaCarotene" | "mufa";

export interface NutrientBlock {
  id: string;
  title: string;
  benefit: string;
  amount?: string;
  dv?: number;
  nutrients: string[];
  tags: BenefitId[];
  evidence: Evidence;
  sources: string[];
}

export interface Layer {
  key: LayerKey;
  role: string;
  botanical: string;
  edible: "Eaten" | "Edible, often discarded" | "Not eaten" | "Eat sparingly";
  note?: string;
  nutrients: NutrientBlock[];
}

export interface Macros {
  energyKcal: number;
  water: number;
  carbs: number;
  sugars: number;
  fiber: number;
  protein: number;
  fat: number;
}

export interface Micro {
  key: MicroKey;
  amount: number;
}

export interface Caution {
  title: string;
  body: string;
  sources: string[];
}

export interface Fruit {
  id: string;
  name: string;
  binomial: string;
  fdcId: number;
  fdcDescription: string;
  /** Four aurora pigments for the background mesh, then one accent. */
  palette: [string, string, string, string];
  accent: string;
  tagline: string;
  whole: NutrientBlock[];
  layers: [Layer, Layer, Layer];
  macros: Macros;
  micros: Micro[];
  cautions: Caution[];
}

export interface Source {
  id: string;
  label: string;
  publisher: string;
  year?: number;
  url: string;
  kind: "database" | "factsheet" | "guide" | "study" | "review";
}

export interface Synergy {
  id: string;
  fruitIds: string[];
  fruitSide: { label: string; nutrient: string };
  partner: { label: string; nutrient: string };
  outcome: string;
  mechanism: string;
  strength: "Strong" | "Moderate" | "Emerging" | "Caution";
  tags: BenefitId[];
  sources: string[];
}
