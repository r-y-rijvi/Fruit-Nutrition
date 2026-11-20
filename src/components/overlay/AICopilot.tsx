"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Loader2, ShieldCheck, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FRUIT_BY_ID } from "@/data";
import { SOURCES, SOURCE_NUMBER } from "@/data/sources";
import type { BenefitId, LayerKey } from "@/data/types";
import { scrollToId } from "@/lib/scroll";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

interface SceneAction {
  fruitId: string;
  view: "whole" | "layers";
  activeLayer: LayerKey;
  benefit: BenefitId | null;
}

interface CopilotReply {
  query: string;
  answer: string;
  citationIds: string[];
  caution: string;
  sceneAction: SceneAction;
  mode: "gemini-2.5-flash" | "grounded-fallback";
}

const SPRING = { type: "spring" as const, stiffness: 300, damping: 26 };

const DEMO_PROMPTS = [
  "Which fruit pairing boosts plant iron absorption?",
  "What nutrients are in mango peel vs flesh?",
  "Any fruit cautions if I take warfarin?",
  "রোগ প্রতিরোধ ক্ষমতার জন্য কোন ফল ভালো?",
];

export function AICopilot() {
  const open = useApp((s) => s.copilotOpen);
  const setOpen = useApp((s) => s.setCopilotOpen);
  const pendingQuery = useApp((s) => s.copilotQuery);
  const setPendingQuery = useApp((s) => s.setCopilotQuery);
  const activeFruit = useApp((s) => s.fruitId);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<CopilotReply | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const applySceneAction = (action: SceneAction) => {
    const st = useApp.getState();
    if (action.fruitId && FRUIT_BY_ID[action.fruitId] && st.fruitId !== action.fruitId) {
      st.setFruit(action.fruitId);
    }
    if (action.benefit !== undefined) {
      st.setBenefit(action.benefit);
    }
    if (action.view === "layers") {
      window.setTimeout(() => {
        const cur = useApp.getState();
        if (cur.view === "whole") cur.explode();
        cur.setActiveLayer(action.activeLayer);
      }, st.fruitId !== action.fruitId ? 450 : 60);
    }
  };

  const ask = async (raw: string) => {
    const q = raw.trim();
    if (!q || loading) return;
    setLoading(true);
    setError("");
    setInput(q);
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, activeFruit: useApp.getState().fruitId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not reach AI Copilot");
      setReply({ query: q, ...data });
      if (data.sceneAction) applySceneAction(data.sceneAction);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not reach AI Copilot");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  useEffect(() => {
    if (pendingQuery) {
      const q = pendingQuery;
      setPendingQuery(null);
      setOpen(true);
      void ask(q);
    }
  }, [pendingQuery]);

  const jumpToSource = (id: string) => {
    setOpen(false);
    scrollToId(`src-${id}`);
    window.setTimeout(() => {
      const el = document.getElementById(`src-${id}`);
      if (el) {
        el.setAttribute("data-flash", "1");
        window.setTimeout(() => el.removeAttribute("data-flash"), 1400);
      }
    }, 550);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Open AI Nutrition Copilot"
        className="on-dark fixed right-5 bottom-5 z-50 flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-[13.5px] font-semibold text-white shadow-[0_18px_40px_-10px_rgb(18_10_20/0.65)] ring-1 ring-white/20 transition-transform hover:scale-[1.03] active:scale-95"
      >
        <Sparkles className="size-4 text-[var(--accent)]" aria-hidden />
        <span>AI Copilot</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.aside
            role="dialog"
            aria-label="FruitAnatomy 3D AI Clinical Copilot"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96, transition: { duration: 0.16 } }}
            transition={SPRING}
            className="fixed right-4 bottom-20 left-4 z-50 mx-auto w-auto max-w-[460px] overflow-hidden rounded-[28px] border border-ink/12 bg-paper/95 text-ink shadow-[0_32px_80px_-20px_rgb(18_10_20/0.55)] backdrop-blur-2xl sm:right-5 sm:left-auto sm:w-[440px]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="on-dark grid size-9 place-items-center rounded-xl bg-ink text-[var(--accent)]">
                  <Sparkles className="size-4" aria-hidden />
                </span>
                <div>
                  <h2 className="font-display text-[15px] font-bold tracking-[-0.02em] text-ink">AI Nutrition Copilot</h2>
                  <p className="font-mono text-[10px] tracking-[0.06em] text-ink/55 uppercase">
                    Grounded in 39 USDA / NIH / PubMed sources
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close AI Copilot"
                className="grid size-8 place-items-center rounded-full text-ink/60 hover:bg-ink/8 hover:text-ink"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <div className="max-h-[min(62vh,460px)] overflow-y-auto p-4" data-lenis-prevent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void ask(input);
                }}
                className="flex gap-2"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask in English or Bangla (e.g., iron, peel, diabetes)..."
                  className="min-w-0 flex-1 rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-[14px] text-ink placeholder:text-ink/45 focus:border-ink focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="on-dark inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-white transition-opacity disabled:opacity-45"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Ask"}
                </button>
              </form>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {DEMO_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void ask(prompt)}
                    className="rounded-full border border-ink/12 bg-white/80 px-3 py-1 text-left text-[12px] font-medium text-ink/75 transition-colors hover:bg-ink hover:text-white"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {error && (
                <p className="mt-3 rounded-xl bg-magenta/10 px-3.5 py-2.5 text-[13px] font-medium text-[#A3104F]">
                  {error}
                </p>
              )}

              {reply && (
                <div className="mt-4 space-y-3 rounded-2xl border border-ink/10 bg-white p-4 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald/15 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[#13723F] uppercase">
                      <ShieldCheck className="size-3.5" aria-hidden />
                      {reply.mode === "gemini-2.5-flash" ? "Gemini 2.5 Flash · Grounded" : "Verified Local RAG"}
                    </span>
                    <span className="font-mono text-[10px] text-ink/55 uppercase">
                      3D: {FRUIT_BY_ID[reply.sceneAction.fruitId]?.name ?? activeFruit} · {reply.sceneAction.activeLayer}
                    </span>
                  </div>

                  <p className="text-[14px] leading-relaxed text-ink">{reply.answer}</p>

                  {reply.citationIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {reply.citationIds.map((id) => {
                        const src = SOURCES[id];
                        const num = SOURCE_NUMBER[id];
                        if (!src) return null;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => jumpToSource(id)}
                            title={src.label}
                            className="inline-flex items-center gap-1 rounded-lg border border-ink/12 bg-ink/[0.04] px-2 py-1 font-mono text-[11px] font-medium text-ink/80 hover:bg-ink hover:text-white"
                          >
                            <span>[{num}] {src.publisher.split(" ")[0]}</span>
                            <ArrowUpRight className="size-3" aria-hidden />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <p className={cn("border-t border-ink/8 pt-2.5 text-[12px] leading-snug text-ink/60")}>
                    {reply.caution}
                  </p>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
