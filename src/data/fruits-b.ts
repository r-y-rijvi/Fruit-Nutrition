import type { Fruit } from "./types";
import { fiberBlock, researchBlock, usdaBlock } from "./nutrients";

const VIT_C_BENEFIT = "Collagen synthesis, immune defense, iron absorption";

export const pomegranate: Fruit = {
  id: "pomegranate",
  name: "Pomegranate",
  binomial: "Punica granatum",
  fdcId: 169134,
  fdcDescription: "Pomegranates, raw",
  palette: ["#E8247C", "#FF4D6D", "#B5179E", "#FF9EBB"],
  accent: "#FF3D7F",
  tagline: "A leathery husk packed with hundreds of juice-coated seeds.",
  macros: { energyKcal: 83, water: 77.93, carbs: 18.7, sugars: 13.7, fiber: 4, protein: 1.67, fat: 1.17 },
  micros: [
    { key: "copper", amount: 0.158 }, { key: "vitK", amount: 16.4 }, { key: "folate", amount: 38 },
    { key: "vitC", amount: 10.2 }, { key: "potassium", amount: 236 }, { key: "manganese", amount: 0.119 },
    { key: "vitE", amount: 0.6 }, { key: "b6", amount: 0.075 }, { key: "magnesium", amount: 12 },
  ],
  whole: [
    fiberBlock(4, "Chew the seeds: they carry most of this fiber", ["viuda2010"]),
    usdaBlock("copper", 0.158, { benefit: "Iron metabolism and connective tissue", tags: ["skin"] }),
    usdaBlock("vitK", 16.4, { benefit: "Blood clotting and bone mineralization", tags: ["bone"], sources: ["ods-vitk"] }),
    usdaBlock("folate", 38, { benefit: "Red blood cell formation and DNA synthesis", tags: [], sources: ["ods-folate"] }),
  ],
  layers: [
    {
      key: "peel", role: "Husk / Rind", botanical: "Exocarp + mesocarp", edible: "Not eaten",
      note: "Bitter and astringent. Used in extracts, not eaten.",
      nutrients: [
        researchBlock("punicalagins", "Punicalagins & ellagitannins", "Richest in the husk; whole-fruit pressing carries them into juice", ["punicalagins", "ellagitannins", "tannins", "polyphenols", "antioxidants"], ["heart"], "lab", ["gil2000", "viuda2010"]),
        researchBlock("ellagic", "Ellagic acid", "Released from ellagitannins; studied for anti-inflammatory effects", ["ellagic acid", "polyphenols"], [], "lab", ["viuda2010"]),
      ],
    },
    {
      key: "flesh", role: "Arils", botanical: "Sarcotesta (juicy seed coat)", edible: "Eaten",
      nutrients: [
        usdaBlock("vitK", 16.4, { benefit: "Blood clotting and bone mineralization", tags: ["bone"], sources: ["ods-vitk"] }),
        usdaBlock("folate", 38, { benefit: "Red blood cell formation and DNA synthesis", tags: [], sources: ["ods-folate"] }),
        researchBlock("pom-anthocyanins", "Anthocyanins", "Ruby pigments in aril juice with antioxidant activity", ["anthocyanins", "polyphenols", "antioxidants"], ["heart"], "lab", ["viuda2010"]),
        usdaBlock("potassium", 236, { benefit: "Fluid balance and blood pressure regulation", tags: ["heart"], sources: ["ods-k"] }),
      ],
    },
    {
      key: "core", role: "Seeds & Septa", botanical: "Seed + membranes", edible: "Eaten",
      nutrients: [
        fiberBlock(4, "The crunchy seeds deliver most of the fiber", ["viuda2010"]),
        researchBlock("punicic", "Punicic acid", "Seed oil is dominated by this conjugated fatty acid", ["punicic acid", "seed oil", "fatty acids"], [], "lab", ["viuda2010"]),
        researchBlock("septa", "Bitter septa", "White membranes hold tannins; usually picked out", ["tannins", "polyphenols"], [], "lab", ["viuda2010"]),
      ],
    },
  ],
  cautions: [
    { title: "On warfarin?", body: "Pomegranate supplies vitamin K. Keep intake steady and ask your clinician about juice.", sources: ["ods-vitk"] },
  ],
};

export const blueberry: Fruit = {
  id: "blueberry",
  name: "Blueberry",
  binomial: "Vaccinium corymbosum",
  fdcId: 171711,
  fdcDescription: "Blueberries, raw",
  palette: ["#4361EE", "#7209B7", "#4CC9F0", "#F72585"],
  accent: "#7B8CFF",
  tagline: "A true berry whose color lives almost entirely in its skin.",
  macros: { energyKcal: 57, water: 84.21, carbs: 14.49, sugars: 9.96, fiber: 2.4, protein: 0.74, fat: 0.33 },
  micros: [
    { key: "vitK", amount: 19.3 }, { key: "manganese", amount: 0.336 }, { key: "vitC", amount: 9.7 },
    { key: "copper", amount: 0.057 }, { key: "vitE", amount: 0.57 }, { key: "potassium", amount: 77 },
    { key: "folate", amount: 6 }, { key: "lutein", amount: 80 },
  ],
  whole: [
    researchBlock("bb-anthocyanins-whole", "Anthocyanins", "Higher berry intake linked to slower cognitive decline", ["anthocyanins", "flavonoids", "polyphenols", "antioxidants"], ["brain"], "observational", ["devore2012", "kalt2020"]),
    usdaBlock("vitK", 19.3, { benefit: "Blood clotting and bone health", tags: ["bone"], sources: ["ods-vitk"] }),
    usdaBlock("manganese", 0.336, { benefit: "Cofactor for antioxidant enzymes and bone formation", tags: ["bone"] }),
    fiberBlock(2.4, "Skins and seeds add bulk and feed gut bacteria"),
  ],
  layers: [
    {
      key: "peel", role: "Skin", botanical: "Exocarp", edible: "Eaten",
      nutrients: [
        researchBlock("bb-anthocyanins", "Anthocyanins", "Concentrated in the skin; linked to slower cognitive decline", ["anthocyanins", "flavonoids", "polyphenols", "antioxidants"], ["brain"], "observational", ["kalt2020", "devore2012"]),
        researchBlock("bb-vascular", "Flavonoids for blood vessels", "Improved vascular function within hours in a controlled trial", ["polyphenols", "flavonoids"], ["heart"], "clinical", ["rodriguez2013"]),
      ],
    },
    {
      key: "flesh", role: "Flesh / Pulp", botanical: "Mesocarp", edible: "Eaten",
      nutrients: [
        usdaBlock("vitK", 19.3, { benefit: "Blood clotting and bone health", tags: ["bone"], sources: ["ods-vitk"] }),
        usdaBlock("manganese", 0.336, { benefit: "Cofactor for antioxidant enzymes and bone formation", tags: ["bone"] }),
        usdaBlock("vitC", 9.7, { benefit: VIT_C_BENEFIT, tags: ["immunity", "skin"], sources: ["ods-vitc"] }),
        usdaBlock("lutein", 80, { benefit: "Macular pigment that filters blue light", tags: ["vision"], sources: ["ods-vita"] }),
      ],
    },
    {
      key: "core", role: "Seeds", botanical: "Endocarp + seeds", edible: "Eaten",
      nutrients: [
        fiberBlock(2.4, "Tiny seeds and skins supply the insoluble fraction"),
        researchBlock("bb-seed-oil", "Linoleic & α-linolenic acids", "Cold-pressed seed oil is rich in these essential fats", ["omega-3", "omega-6", "ala", "linoleic acid"], [], "lab", ["parry2005"]),
      ],
    },
  ],
  cautions: [
    { title: "Pairing with milk", body: "One small study found milk blunted blueberry antioxidant uptake. Evidence is mixed.", sources: ["serafini2009"] },
  ],
};

export const apple: Fruit = {
  id: "apple",
  name: "Apple",
  binomial: "Malus domestica",
  fdcId: 171688,
  fdcDescription: "Apples, raw, with skin",
  palette: ["#FF3B3F", "#FF8A5B", "#C9F27B", "#FFD166"],
  accent: "#FF5A5F",
  tagline: "A pome: the flesh grows from the flower base around a papery core.",
  macros: { energyKcal: 52, water: 85.56, carbs: 13.81, sugars: 10.4, fiber: 2.4, protein: 0.26, fat: 0.17 },
  micros: [
    { key: "vitC", amount: 4.6 }, { key: "vitK", amount: 2.2 }, { key: "potassium", amount: 107 },
    { key: "copper", amount: 0.027 }, { key: "manganese", amount: 0.035 }, { key: "vitE", amount: 0.18 },
    { key: "lutein", amount: 29 },
  ],
  whole: [
    fiberBlock(2.4, "Pectin plus skin fiber; linked to lower LDL", ["hsph-apples"]),
    researchBlock("apple-quercetin-whole", "Quercetin & procyanidins", "Apple intake tied to lower heart-disease risk in cohorts", ["quercetin", "procyanidins", "flavonoids", "polyphenols"], ["heart"], "observational", ["boyer2004", "hsph-apples"]),
    usdaBlock("vitC", 4.6, { benefit: VIT_C_BENEFIT, tags: ["immunity", "skin"], sources: ["ods-vitc"] }),
    usdaBlock("potassium", 107, { benefit: "Fluid balance and nerve signaling", tags: ["heart"], sources: ["ods-k"] }),
  ],
  layers: [
    {
      key: "peel", role: "Skin", botanical: "Exocarp", edible: "Eaten",
      nutrients: [
        {
          id: "apple-skin-fiber", title: "Skin fiber", amount: "+1.1 g",
          benefit: "Peeling drops fiber from 2.4 g to 1.3 g per 100 g (USDA)",
          nutrients: ["fiber", "insoluble fiber"], tags: ["digestion"], evidence: "usda", sources: ["usda-sr", "hsph-fiber"],
        },
        researchBlock("apple-quercetin", "Quercetin glycosides", "Mostly in the skin; linked to heart and lung health in cohorts", ["quercetin", "flavonoids", "polyphenols"], ["heart"], "observational", ["boyer2004"]),
        researchBlock("apple-peel-antiox", "Procyanidins", "Peel shows more antioxidant activity than flesh in lab tests", ["procyanidins", "polyphenols", "antioxidants"], [], "lab", ["boyer2004"]),
      ],
    },
    {
      key: "flesh", role: "Flesh", botanical: "Hypanthium (accessory tissue)", edible: "Eaten",
      note: "Flesh values are USDA \"Apples, raw, without skin\" (FDC 171689).",
      nutrients: [
        researchBlock("pectin", "Pectin", "Gel-forming soluble fiber that helps lower LDL", ["pectin", "soluble fiber", "fiber"], ["heart", "digestion"], "observational", ["hsph-fiber", "hsph-apples"]),
        usdaBlock("vitC", 4, { benefit: "Most of the apple's vitamin C stays in the flesh", tags: ["immunity", "skin"], sources: ["ods-vitc"] }),
        usdaBlock("potassium", 90, { benefit: "Fluid balance and nerve signaling", tags: ["heart"], sources: ["ods-k"] }),
      ],
    },
    {
      key: "core", role: "Core & Seeds", botanical: "Endocarp (carpels) + seeds", edible: "Not eaten",
      note: "Swallowing a few whole seeds is not a concern. Don't grind them into food.",
      nutrients: [
        researchBlock("amygdalin", "Amygdalin", "Releases cyanide when seeds are crushed and chewed", ["amygdalin", "cyanogenic glycoside"], [], "lab", ["bolarinwa2015"]),
        researchBlock("phloridzin", "Phloridzin", "Apple-specific polyphenol concentrated in seeds and skin", ["phloridzin", "phlorizin", "polyphenols"], [], "lab", ["boyer2004"]),
      ],
    },
  ],
  cautions: [
    { title: "Apple seeds", body: "Seeds contain amygdalin. A few swallowed whole pass through; crushed seeds in quantity are a risk.", sources: ["bolarinwa2015"] },
  ],
};

export const papaya: Fruit = {
  id: "papaya",
  name: "Papaya",
  binomial: "Carica papaya",
  fdcId: 169926,
  fdcDescription: "Papayas, raw",
  palette: ["#FF7F50", "#FFB347", "#FF5E78", "#7FD8BE"],
  accent: "#FF8C42",
  tagline: "A soft berry with a hollow center full of peppery black seeds.",
  macros: { energyKcal: 43, water: 88.06, carbs: 10.82, sugars: 7.82, fiber: 1.7, protein: 0.47, fat: 0.26 },
  micros: [
    { key: "vitC", amount: 60.9 }, { key: "lycopene", amount: 1828 }, { key: "folate", amount: 37 },
    { key: "vitA", amount: 47 }, { key: "betaCarotene", amount: 274 }, { key: "magnesium", amount: 21 },
    { key: "potassium", amount: 182 }, { key: "lutein", amount: 89 }, { key: "vitE", amount: 0.3 },
  ],
  whole: [
    usdaBlock("vitC", 60.9, { benefit: VIT_C_BENEFIT, tags: ["immunity", "skin"], sources: ["ods-vitc"] }),
    usdaBlock("lycopene", 1828, { benefit: "Red carotenoid antioxidant; fat improves absorption", tags: ["heart", "skin"], sources: ["ods-vita"] }),
    usdaBlock("folate", 37, { benefit: "DNA synthesis and red blood cell formation", tags: [], sources: ["ods-folate"] }),
    usdaBlock("vitA", 47, { title: "Vitamin A & Beta-Carotene", benefit: "Vision, skin renewal, immune function", tags: ["vision", "skin", "immunity"], sources: ["ods-vita"] }),
  ],
  layers: [
    {
      key: "peel", role: "Skin", botanical: "Exocarp", edible: "Not eaten",
      note: "Unripe skin and sap carry papain-rich latex, a known allergen.",
      nutrients: [
        researchBlock("papain", "Papain", "Protein-digesting enzyme concentrated in green fruit and sap", ["papain", "enzyme", "protease", "latex"], ["digestion"], "lab", ["wagner2002"]),
        researchBlock("latex-proteins", "Latex proteins", "Can cross-react in people with latex allergy", ["latex", "chitinase", "allergen"], [], "lab", ["wagner2002"]),
      ],
    },
    {
      key: "flesh", role: "Flesh / Pulp", botanical: "Mesocarp", edible: "Eaten",
      nutrients: [
        usdaBlock("vitC", 60.9, { benefit: VIT_C_BENEFIT, tags: ["immunity", "skin"], sources: ["ods-vitc"] }),
        usdaBlock("lycopene", 1828, { benefit: "Red carotenoid antioxidant, as in tomatoes", tags: ["heart", "skin"], sources: ["ods-vita"] }),
        usdaBlock("vitA", 47, { title: "Vitamin A & Beta-Carotene", benefit: "Vision and skin renewal; 274 µg beta-carotene", tags: ["vision", "skin", "immunity"], sources: ["ods-vita"] }),
        usdaBlock("folate", 37, { benefit: "DNA synthesis and red blood cell formation", tags: [], sources: ["ods-folate"] }),
      ],
    },
    {
      key: "core", role: "Seeds", botanical: "Seeds + sarcotesta", edible: "Eat sparingly",
      note: "Peppery and bitter. Human safety data are limited; skip them during pregnancy.",
      nutrients: [
        researchBlock("bitc", "Benzyl isothiocyanate", "Peppery compound behind the seeds' anti-parasitic activity in lab work", ["benzyl isothiocyanate", "isothiocyanates"], [], "lab", ["kermanshai2001"]),
      ],
    },
  ],
  cautions: [
    { title: "Latex-fruit syndrome", body: "Papaya latex can cross-react in people allergic to natural rubber latex.", sources: ["wagner2002"] },
  ],
};
