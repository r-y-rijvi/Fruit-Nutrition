import { NextResponse } from "next/server";
import { FRUITS, FRUIT_BY_ID, allBlocks, search } from "@/data";
import { BENEFITS, MICROS } from "@/data/nutrients";
import { SOURCES, SOURCE_NUMBER } from "@/data/sources";
import { SYNERGIES } from "@/data/synergies";
import type { BenefitId, LayerKey } from "@/data/types";

interface SceneAction {
  fruitId: string;
  view: "whole" | "layers";
  activeLayer: LayerKey;
  benefit: BenefitId | null;
}

interface CopilotResponse {
  answer: string;
  citationIds: string[];
  caution: string;
  sceneAction: SceneAction;
  mode: "gemini-2.5-flash" | "grounded-fallback";
}

const VALID_FRUITS = new Set(FRUITS.map((f) => f.id));
const VALID_LAYERS = new Set<LayerKey>(["peel", "flesh", "core"]);
const VALID_BENEFITS = new Set<BenefitId>(BENEFITS.map((b) => b.id));

function buildCompactKB() {
  return {
    fruits: FRUITS.map((f) => ({
      id: f.id,
      name: f.name,
      binomial: f.binomial,
      fdcId: f.fdcId,
      tagline: f.tagline,
      macrosPer100g: f.macros,
      topMicros: f.micros.slice(0, 8).map((m) => `${MICROS[m.key].label}: ${m.amount}${MICROS[m.key].unit}`),
      layers: f.layers.map((l) => ({
        key: l.key,
        role: l.role,
        botanical: l.botanical,
        edible: l.edible,
        highlights: l.nutrients.map((n) => ({
          title: n.title,
          benefit: n.benefit,
          tags: n.tags,
          sources: n.sources,
        })),
      })),
      cautions: f.cautions.map((c) => ({ title: c.title, body: c.body, sources: c.sources })),
    })),
    synergies: SYNERGIES.map((s) => ({
      id: s.id,
      fruitIds: s.fruitIds,
      fruitSide: `${s.fruitSide.nutrient} (${s.fruitSide.label})`,
      partner: `${s.partner.nutrient} (${s.partner.label})`,
      outcome: s.outcome,
      mechanism: s.mechanism,
      strength: s.strength,
      tags: s.tags,
      sources: s.sources,
    })),
    validSourceIds: Object.keys(SOURCES),
  };
}

const KB_JSON = JSON.stringify(buildCompactKB());

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    answer: { type: "STRING" },
    citationIds: { type: "ARRAY", items: { type: "STRING" } },
    caution: { type: "STRING" },
    sceneAction: {
      type: "OBJECT",
      properties: {
        fruitId: { type: "STRING" },
        view: { type: "STRING" },
        activeLayer: { type: "STRING" },
        benefit: { type: "STRING" },
      },
      required: ["fruitId", "view", "activeLayer", "benefit"],
    },
  },
  required: ["answer", "citationIds", "caution", "sceneAction"],
};

function sanitizeSceneAction(raw: Partial<SceneAction> | undefined, fallbackFruit: string): SceneAction {
  const fruitId = raw?.fruitId && VALID_FRUITS.has(raw.fruitId) ? raw.fruitId : VALID_FRUITS.has(fallbackFruit) ? fallbackFruit : "mango";
  const view = raw?.view === "layers" ? "layers" : "whole";
  const activeLayer: LayerKey = raw?.activeLayer && VALID_LAYERS.has(raw.activeLayer) ? raw.activeLayer : "flesh";
  const benefit: BenefitId | null =
    raw?.benefit && VALID_BENEFITS.has(raw.benefit as BenefitId) ? (raw.benefit as BenefitId) : null;
  return { fruitId, view, activeLayer, benefit };
}

/** Deterministic grounded fallback so the Copilot always responds cleanly even without an API key or if rate-limited. */
function localGroundedFallback(query: string, activeFruit: string): CopilotResponse {
  const q = query.toLowerCase();
  const isBangla = /[\u0980-\u09FF]/.test(query);

  // Check synergy matches first
  const synMatch = SYNERGIES.find(
    (s) =>
      q.includes(s.id) ||
      (q.includes("iron") && s.id === "iron") ||
      ((q.includes("warfarin") || q.includes("blood thinner")) && s.id === "warfarin") ||
      (q.includes("milk") && s.id === "blueberry-milk") ||
      ((q.includes("carotenoid") || q.includes("vitamin a") || q.includes("eye") || q.includes("vision")) &&
        (s.id === "carotenoids" || s.id === "provitamin-a")) ||
      ((q.includes("blood pressure") || q.includes("sodium") || q.includes("heart")) && s.id === "potassium-dash") ||
      ((q.includes("gut") || q.includes("yogurt") || q.includes("digestion") || q.includes("fiber")) && s.id === "synbiotic")
  );

  if (synMatch) {
    const fId = synMatch.fruitIds.includes(activeFruit) ? activeFruit : synMatch.fruitIds[0] || "mango";
    const fruit = FRUIT_BY_ID[fId];
    const answer = isBangla
      ? `${fruit.name}-এর ${synMatch.fruitSide.nutrient} এবং ${synMatch.partner.label}-এর সমন্বয়ে "${synMatch.outcome}" পাওয়া যায়। ${synMatch.mechanism}`
      : `${synMatch.outcome}: pair ${synMatch.fruitSide.label} (${synMatch.fruitSide.nutrient}) with ${synMatch.partner.label} (${synMatch.partner.nutrient}). ${synMatch.mechanism} Evidence strength: ${synMatch.strength}.`;
    return {
      answer,
      citationIds: synMatch.sources.filter((id) => Boolean(SOURCES[id])),
      caution: "Educational use only, not medical advice. Consult a clinician for personalized dietary or medication guidance.",
      sceneAction: {
        fruitId: fId,
        view: "layers",
        activeLayer: "flesh",
        benefit: synMatch.tags[0] ?? null,
      },
      mode: "grounded-fallback",
    };
  }

  // Check fruit / nutrient / benefit search
  const hits = search(query);
  let targetId = VALID_FRUITS.has(activeFruit) ? activeFruit : "mango";
  let targetBenefit: BenefitId | null = null;
  let targetLayer: LayerKey = q.includes("peel") || q.includes("skin") || q.includes("খোসা") ? "peel" : q.includes("seed") || q.includes("core") || q.includes("pit") || q.includes("বীজ") ? "core" : "flesh";

  if (hits[0]) {
    if (hits[0].type === "fruit") targetId = hits[0].fruit.id;
    else if (hits[0].type === "nutrient") targetId = hits[0].ranked[0]?.fruit.id ?? targetId;
    else if (hits[0].type === "benefit") {
      targetBenefit = hits[0].id;
      targetId = hits[0].fruits[0]?.id ?? targetId;
    }
  } else if (q.includes("রোগ প্রতিরোধ") || q.includes("ইমিউন") || q.includes("immunity")) {
    targetBenefit = "immunity";
    targetId = "kiwi";
  } else if (q.includes("আম") || q.includes("mango")) {
    targetId = "mango";
  } else if (q.includes("পেঁপে") || q.includes("papaya")) {
    targetId = "papaya";
  } else if (q.includes("ডালিম") || q.includes("বেদানা") || q.includes("pomegranate")) {
    targetId = "pomegranate";
  }

  const fruit = FRUIT_BY_ID[targetId] ?? FRUITS[0];
  const layer = fruit.layers.find((l) => l.key === targetLayer) ?? fruit.layers[1];
  const topBlock = layer.nutrients[0] ?? allBlocks(fruit)[0];
  const cites = Array.from(new Set(["usda-sr", ...(topBlock?.sources ?? [])])).filter((id) => Boolean(SOURCES[id]));

  const answer = isBangla
    ? `${fruit.name} (${fruit.binomial})-এর প্রতি ১০০ গ্রামে ${fruit.macros.energyKcal} কিলোক্যালরি, ${fruit.macros.fiber} গ্রাম ফাইবার রয়েছে। এর ${layer.role} (${layer.botanical}) অংশে "${topBlock?.title}" পাওয়া যায়—${topBlock?.benefit}`
    : `${fruit.name} (${fruit.binomial}) provides ${fruit.macros.energyKcal} kcal and ${fruit.macros.fiber} g fiber per 100 g raw. In its ${layer.role.toLowerCase()} (${layer.botanical}, ${layer.edible.toLowerCase()}), ${topBlock?.title} stands out: ${topBlock?.benefit}`;

  return {
    answer,
    citationIds: cites,
    caution: fruit.cautions[0]
      ? `${fruit.cautions[0].title}: ${fruit.cautions[0].body}`
      : "Educational use only, not medical advice. Values are per 100 g raw fruit from USDA FoodData Central.",
    sceneAction: {
      fruitId: fruit.id,
      view: "layers",
      activeLayer: layer.key,
      benefit: targetBenefit,
    },
    mode: "grounded-fallback",
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    const activeFruit = typeof body?.activeFruit === "string" ? body.activeFruit : "mango";

    if (!query) {
      return NextResponse.json({ error: "Please enter a nutrition or fruit question." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(localGroundedFallback(query, activeFruit));
    }

    const systemPrompt = `You are FruitAnatomy 3D Clinical Copilot, an AI-native nutrition and bioavailability assistant built for Bangladesh and global users.
Answer in the EXACT language of the user's question (English or Bangla) in 2-4 clear, evidence-backed sentences.
ONLY use facts from this verified USDA/NIH/Harvard/PubMed knowledge base:
${KB_JSON}

Strict rules:
1. citationIds MUST only contain exact string IDs from validSourceIds (e.g. "hallberg1989", "ods-vitc", "usda-sr"). Never invent IDs.
2. sceneAction.fruitId MUST be one of: ${FRUITS.map((f) => f.id).join(", ")} (default "${activeFruit}").
3. sceneAction.view MUST be "layers" when explaining peel/flesh/core anatomy or nutrient locations, or "whole" for general overviews.
4. sceneAction.activeLayer MUST be "peel", "flesh", or "core".
5. sceneAction.benefit MUST be one of: ${BENEFITS.map((b) => b.id).join(", ")}, or "" if none applies.
6. Always include a concise medical/allergy disclaimer in caution (educational use only, not medical advice).`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: query }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
          },
        }),
      }
    );

    if (!res.ok) {
      return NextResponse.json(localGroundedFallback(query, activeFruit));
    }

    const raw = await res.json();
    const text = raw?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return NextResponse.json(localGroundedFallback(query, activeFruit));
    }

    const parsed = JSON.parse(text);
    const citationIds: string[] = Array.isArray(parsed.citationIds)
      ? Array.from(new Set(parsed.citationIds.filter((id: unknown): id is string => typeof id === "string" && Boolean(SOURCES[id]))))
      : ["usda-sr"];

    if (citationIds.length === 0) citationIds.push("usda-sr");

    const response: CopilotResponse = {
      answer: typeof parsed.answer === "string" ? parsed.answer : "No answer generated.",
      citationIds,
      caution:
        typeof parsed.caution === "string" && parsed.caution.trim()
          ? parsed.caution
          : "Educational use only, not medical advice.",
      sceneAction: sanitizeSceneAction(parsed.sceneAction, activeFruit),
      mode: "gemini-2.5-flash",
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(localGroundedFallback("mango immunity", "mango"));
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    sourcesIndexed: Object.keys(SOURCE_NUMBER).length,
    fruitsIndexed: FRUITS.length,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
}
