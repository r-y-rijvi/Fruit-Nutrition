import type { Fruit } from "./types";
import { fiberBlock, researchBlock, usdaBlock } from "./nutrients";

const VIT_C_BENEFIT = "Collagen synthesis, immune defense, iron absorption";

export const mango: Fruit = {
  id: "mango",
  name: "Mango",
  binomial: "Mangifera indica",
  fdcId: 169910,
  fdcDescription: "Mangos, raw",
  palette: ["#FFB627", "#FF7A1A", "#9BD84E", "#F25C54"],
  accent: "#FFB627",
  tagline: "A drupe: thin skin, deep-orange mesocarp, one fibrous stone.",
  macros: { energyKcal: 60, water: 83.46, carbs: 14.98, sugars: 13.7, fiber: 1.6, protein: 0.82, fat: 0.38 },
  micros: [
    { key: "vitC", amount: 36.4 }, { key: "vitA", amount: 54 }, { key: "betaCarotene", amount: 640 },
    { key: "folate", amount: 43 }, { key: "copper", amount: 0.111 }, { key: "b6", amount: 0.119 },
    { key: "vitE", amount: 0.9 }, { key: "vitK", amount: 4.2 }, { key: "potassium", amount: 168 },
    { key: "magnesium", amount: 10 }, { key: "lutein", amount: 23 },
  ],
  whole: [
    usdaBlock("vitC", 36.4, { benefit: VIT_C_BENEFIT, tags: ["immunity", "skin"], sources: ["ods-vitc"] }),
    usdaBlock("vitA", 54, { title: "Vitamin A & Beta-Carotene", benefit: "Vision, skin barrier renewal, cellular protection", tags: ["vision", "skin", "immunity"], sources: ["ods-vita"] }),
    usdaBlock("folate", 43, { benefit: "DNA synthesis and healthy red blood cells", tags: [], sources: ["ods-folate"] }),
    usdaBlock("copper", 0.111, { benefit: "Iron metabolism and collagen cross-linking", tags: ["skin"] }),
  ],
  layers: [
    {
      key: "peel", role: "Outer Peel", botanical: "Exocarp", edible: "Edible, often discarded",
      note: "Contains urushiol-like resorcinols that can cause a rash in people sensitive to poison ivy.",
      nutrients: [
        researchBlock("mangiferin", "Mangiferin & polyphenols", "Peel holds more polyphenols than pulp; strong antioxidant activity in lab tests", ["mangiferin", "polyphenols", "antioxidants", "quercetin"], [], "lab", ["masibo2008"]),
        researchBlock("peel-fiber", "Insoluble fiber", "Fiber-dense skin adds bulk and supports regularity", ["fiber", "insoluble fiber"], ["digestion"], "lab", ["masibo2008"]),
        researchBlock("peel-carotenoids", "Carotenoids", "Peel carries carotenoids too, the precursors of vitamin A", ["carotenoids", "beta-carotene"], ["vision"], "lab", ["masibo2008", "ods-vita"]),
      ],
    },
    {
      key: "flesh", role: "Flesh / Pulp", botanical: "Mesocarp", edible: "Eaten",
      nutrients: [
        usdaBlock("vitC", 36.4, { benefit: VIT_C_BENEFIT, tags: ["immunity", "skin"], sources: ["ods-vitc"] }),
        usdaBlock("vitA", 54, { title: "Vitamin A & Beta-Carotene", benefit: "Vision, skin barrier renewal; 640 µg beta-carotene", tags: ["vision", "skin", "immunity"], sources: ["ods-vita"] }),
        usdaBlock("folate", 43, { benefit: "DNA synthesis and red blood cell formation", tags: [], sources: ["ods-folate"] }),
        usdaBlock("potassium", 168, { benefit: "Fluid balance, nerve signals, blood pressure control", tags: ["heart"], sources: ["ods-k"] }),
      ],
    },
    {
      key: "core", role: "Seed / Stone", botanical: "Endocarp + kernel", edible: "Not eaten",
      note: "The woody husk is inedible. Kernel use is mostly industrial.",
      nutrients: [
        researchBlock("kernel-fat", "Stearic & oleic fats", "Kernel fat is studied as a cocoa-butter alternative", ["fat", "stearic acid", "oleic acid"], [], "lab", ["torres2016"]),
        researchBlock("kernel-tannins", "Tannins & gallic acid", "High antioxidant activity in kernel extracts", ["tannins", "gallic acid", "polyphenols", "antioxidants"], [], "lab", ["torres2016"]),
        researchBlock("husk-fiber", "Lignified husk", "Woody endocarp shields the seed; not a food source", ["fiber", "lignin"], [], "lab", ["torres2016"]),
      ],
    },
  ],
  cautions: [
    { title: "Mango skin rash", body: "Peel and sap share allergens with poison ivy. If you react to poison ivy, let someone else peel it.", sources: ["hershko2005"] },
  ],
};

export const orange: Fruit = {
  id: "orange",
  name: "Orange",
  binomial: "Citrus × sinensis",
  fdcId: 169097,
  fdcDescription: "Oranges, raw, all commercial varieties",
  palette: ["#FF6B00", "#FFB000", "#FF3D7F", "#FFE066"],
  accent: "#FF7A1A",
  tagline: "A hesperidium: oily zest, white pith, juice-filled segments.",
  macros: { energyKcal: 47, water: 86.75, carbs: 11.75, sugars: 9.35, fiber: 2.4, protein: 0.94, fat: 0.12 },
  micros: [
    { key: "vitC", amount: 53.2 }, { key: "folate", amount: 30 }, { key: "potassium", amount: 181 },
    { key: "calcium", amount: 40 }, { key: "lutein", amount: 129 }, { key: "vitA", amount: 11 },
    { key: "betaCarotene", amount: 71 }, { key: "b6", amount: 0.06 }, { key: "magnesium", amount: 10 },
    { key: "copper", amount: 0.045 },
  ],
  whole: [
    usdaBlock("vitC", 53.2, { benefit: VIT_C_BENEFIT, tags: ["immunity", "skin"], sources: ["ods-vitc"] }),
    fiberBlock(2.4, "Whole segments keep the fiber that juicing strips out", ["hsph-fruitveg"]),
    usdaBlock("folate", 30, { benefit: "Cell division and red blood cell formation", tags: [], sources: ["ods-folate"] }),
    researchBlock("hesperidin", "Hesperidin & flavanones", "Citrus flavonoids studied for blood-vessel function", ["hesperidin", "flavonoids", "flavanones", "polyphenols"], ["heart"], "lab", ["garg2001"]),
  ],
  layers: [
    {
      key: "peel", role: "Outer Peel", botanical: "Flavedo + albedo", edible: "Edible, often discarded",
      note: "Peel values are USDA \"Orange peel, raw\" (FDC 169103), per 100 g of peel. Wash before zesting.",
      nutrients: [
        usdaBlock("vitC", 136, { benefit: "About 2.5× the vitamin C of the segments, gram for gram", tags: ["immunity", "skin"], sources: ["ods-vitc"] }),
        fiberBlock(10.6, "Pectin-rich pith; soluble fiber helps lower LDL cholesterol"),
        usdaBlock("calcium", 161, { benefit: "Bone and tooth structure, muscle and nerve function", tags: ["bone"] }),
        researchBlock("peel-flavonoids", "Hesperidin & polymethoxyflavones", "Flavonoids concentrate in zest and pith", ["hesperidin", "flavonoids", "polymethoxyflavones", "nobiletin"], ["heart"], "lab", ["garg2001"]),
      ],
    },
    {
      key: "flesh", role: "Flesh / Segments", botanical: "Endocarp juice vesicles", edible: "Eaten",
      nutrients: [
        usdaBlock("vitC", 53.2, { benefit: VIT_C_BENEFIT, tags: ["immunity", "skin"], sources: ["ods-vitc"] }),
        usdaBlock("folate", 30, { benefit: "Cell division and red blood cell formation", tags: [], sources: ["ods-folate"] }),
        usdaBlock("potassium", 181, { benefit: "Fluid balance and blood pressure regulation", tags: ["heart"], sources: ["ods-k"] }),
        usdaBlock("lutein", 129, { benefit: "Macular pigment that filters blue light", tags: ["vision"], sources: ["ods-vita"] }),
      ],
    },
    {
      key: "core", role: "Seeds & Central Pith", botanical: "Columella + seeds", edible: "Edible, often discarded",
      nutrients: [
        researchBlock("pith-pectin", "Pectin", "Membranes and central pith carry soluble fiber", ["pectin", "fiber", "soluble fiber"], ["digestion", "heart"], "lab", ["hsph-fiber"]),
        researchBlock("pith-hesperidin", "Hesperidin", "Concentrated in pith and membranes, not the juice", ["hesperidin", "flavonoids"], ["heart"], "lab", ["garg2001"]),
        researchBlock("membrane-fiber", "Membrane fiber", "Eat segments whole; juice leaves this fiber behind", ["fiber"], ["digestion"], "observational", ["hsph-fruitveg"]),
      ],
    },
  ],
  cautions: [
    { title: "Whole fruit over juice", body: "Juice keeps the sugar but loses most of the fiber. Harvard's Nutrition Source advises whole fruit and limiting juice.", sources: ["hsph-fruitveg"] },
  ],
};

export const avocado: Fruit = {
  id: "avocado",
  name: "Avocado",
  binomial: "Persea americana",
  fdcId: 171705,
  fdcDescription: "Avocados, raw, all commercial varieties",
  palette: ["#2FBF71", "#A7D129", "#FFE45E", "#13A06A"],
  accent: "#7ED957",
  tagline: "A single-seeded berry with a fat-rich, buttery mesocarp.",
  macros: { energyKcal: 160, water: 73.23, carbs: 8.53, sugars: 0.66, fiber: 6.7, protein: 2, fat: 14.66 },
  micros: [
    { key: "mufa", amount: 9.8 }, { key: "potassium", amount: 485 }, { key: "folate", amount: 81 },
    { key: "vitK", amount: 21 }, { key: "pantothenic", amount: 1.389 }, { key: "b6", amount: 0.257 },
    { key: "vitE", amount: 2.07 }, { key: "copper", amount: 0.19 }, { key: "vitC", amount: 10 },
    { key: "magnesium", amount: 29 }, { key: "lutein", amount: 271 },
  ],
  whole: [
    fiberBlock(6.7, "Feeds gut bacteria and slows digestion; high for a fruit"),
    usdaBlock("mufa", 9.8, { title: "Monounsaturated fat", benefit: "Oleic-acid-rich fat linked to lower LDL and CVD risk", tags: ["heart"], sources: ["hsph-avocado", "pacheco2022"] }),
    usdaBlock("folate", 81, { benefit: "DNA synthesis; key before and during pregnancy", tags: [], sources: ["ods-folate"] }),
    usdaBlock("potassium", 485, { benefit: "Counters sodium's effect on blood pressure", tags: ["heart"], sources: ["ods-k"] }),
  ],
  layers: [
    {
      key: "peel", role: "Outer Peel / Skin", botanical: "Exocarp", edible: "Not eaten",
      note: "Tough and bitter. Not a food.",
      nutrients: [
        researchBlock("peel-procyanidins", "Procyanidins & catechins", "Peel is richer in phenolics than pulp in lab analyses", ["procyanidins", "catechins", "polyphenols", "antioxidants"], [], "lab", ["rodriguez2011"]),
        researchBlock("persin", "Persin", "Natural fungicide in skin and seed; toxic to birds and some livestock", ["persin"], [], "lab", ["persin"]),
      ],
    },
    {
      key: "flesh", role: "Flesh / Pulp", botanical: "Mesocarp", edible: "Eaten",
      nutrients: [
        usdaBlock("mufa", 9.8, { title: "Monounsaturated fat", benefit: "Swapping it for saturated fat lowers LDL", tags: ["heart"], sources: ["hsph-avocado", "pacheco2022"] }),
        fiberBlock(6.7, "Feeds gut bacteria; supports regularity and fullness"),
        usdaBlock("potassium", 485, { benefit: "Counters sodium's effect on blood pressure", tags: ["heart"], sources: ["ods-k"] }),
        usdaBlock("lutein", 271, { benefit: "Macular pigment; the fruit's own fat aids absorption", tags: ["vision"], sources: ["unlu2005"] }),
      ],
    },
    {
      key: "core", role: "Seed", botanical: "Endocarp + embryo", edible: "Not eaten",
      note: "No safe intake of avocado seed has been established. Keep it out of smoothies.",
      nutrients: [
        researchBlock("seed-phenolics", "Procyanidins & phenolic acids", "Seed carries more phenolics than pulp in lab tests", ["polyphenols", "procyanidins", "antioxidants"], [], "lab", ["rodriguez2011", "bangar2022"]),
        researchBlock("seed-starch", "Starch", "Mostly starch by dry weight; studied for food-industry use", ["starch", "carbohydrate"], [], "lab", ["bangar2022"]),
      ],
    },
  ],
  cautions: [
    { title: "On warfarin?", body: "Avocado supplies vitamin K. Keep your vitamin K intake steady rather than avoiding it.", sources: ["ods-vitk"] },
    { title: "Latex-fruit syndrome", body: "People with latex allergy can cross-react to avocado, kiwi and banana.", sources: ["wagner2002"] },
  ],
};

export const kiwi: Fruit = {
  id: "kiwi",
  name: "Kiwi",
  binomial: "Actinidia deliciosa",
  fdcId: 168153,
  fdcDescription: "Kiwifruit, green, raw",
  palette: ["#2FBF71", "#C6F432", "#00C2A8", "#FFE66D"],
  accent: "#9BE564",
  tagline: "A berry: fuzzy skin, emerald pericarp, a ring of tiny seeds.",
  macros: { energyKcal: 61, water: 83.07, carbs: 14.66, sugars: 8.99, fiber: 3, protein: 1.14, fat: 0.52 },
  micros: [
    { key: "vitC", amount: 92.7 }, { key: "vitK", amount: 40.3 }, { key: "copper", amount: 0.13 },
    { key: "vitE", amount: 1.46 }, { key: "potassium", amount: 312 }, { key: "folate", amount: 25 },
    { key: "magnesium", amount: 17 }, { key: "manganese", amount: 0.098 }, { key: "calcium", amount: 34 },
    { key: "lutein", amount: 122 },
  ],
  whole: [
    usdaBlock("vitC", 92.7, { benefit: "A full day's vitamin C in about 100 g", tags: ["immunity", "skin"], sources: ["ods-vitc"] }),
    usdaBlock("vitK", 40.3, { benefit: "Activates clotting proteins and bone-building osteocalcin", tags: ["bone"], sources: ["ods-vitk"] }),
    fiberBlock(3, "In a trial, two kiwis a day eased chronic constipation", ["chey2021"]),
    usdaBlock("vitE", 1.46, { benefit: "Fat-soluble antioxidant that protects cell membranes", tags: ["skin"], sources: ["ods-vite"] }),
  ],
  layers: [
    {
      key: "peel", role: "Outer Skin", botanical: "Exocarp", edible: "Edible, often discarded",
      note: "The fuzzy skin is edible. Wash it and rub off loose hairs.",
      nutrients: [
        researchBlock("skin-fiber", "Insoluble fiber", "Eating the skin raises the fiber you get per fruit", ["fiber", "insoluble fiber"], ["digestion"], "lab", ["richardson2018"]),
        researchBlock("skin-polyphenols", "Polyphenols", "Skin is richer in phenolic antioxidants than the flesh", ["polyphenols", "antioxidants"], [], "lab", ["richardson2018"]),
      ],
    },
    {
      key: "flesh", role: "Flesh / Pulp", botanical: "Outer pericarp", edible: "Eaten",
      nutrients: [
        usdaBlock("vitC", 92.7, { benefit: VIT_C_BENEFIT, tags: ["immunity", "skin"], sources: ["ods-vitc"] }),
        usdaBlock("vitK", 40.3, { benefit: "Blood clotting and bone protein activation", tags: ["bone"], sources: ["ods-vitk"] }),
        researchBlock("actinidin", "Actinidin", "Protein-digesting enzyme; may ease digestion of meals", ["actinidin", "enzyme", "protease"], ["digestion"], "lab", ["richardson2018"]),
        usdaBlock("potassium", 312, { benefit: "Supports normal blood pressure and muscle function", tags: ["heart"], sources: ["ods-k"] }),
      ],
    },
    {
      key: "core", role: "Seeds & Core", botanical: "Columella + inner pericarp", edible: "Eaten",
      nutrients: [
        researchBlock("seed-ala", "Alpha-linolenic acid", "Seed oil is rich in this plant omega-3", ["omega-3", "ala", "alpha-linolenic acid"], ["heart"], "lab", ["richardson2018"]),
        researchBlock("kiwi-laxation", "Fiber + water matrix", "Whole kiwi improved bowel frequency in a clinical trial", ["fiber"], ["digestion"], "clinical", ["chey2021"]),
      ],
    },
  ],
  cautions: [
    { title: "On warfarin?", body: "Kiwi is high in vitamin K. Keep intake consistent day to day.", sources: ["ods-vitk"] },
    { title: "Latex-fruit syndrome", body: "Kiwi is one of the fruits most often linked to latex cross-reactivity.", sources: ["wagner2002"] },
  ],
};
