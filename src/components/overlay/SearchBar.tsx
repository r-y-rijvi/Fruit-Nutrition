"use client";

import { AnimatePresence, motion } from "motion/react";
import { Search, Sparkles } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { search, type SearchHit } from "@/data";
import { scrollToId } from "@/lib/scroll";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const SPRING = { type: "spring" as const, stiffness: 280, damping: 24 };
const SUGGEST = ["Vitamin C", "Potassium", "Immunity", "Brain & cognition", "Fiber", "Avocado"];

function hitKey(h: SearchHit) {
  return h.type === "fruit" ? `f-${h.fruit.id}` : h.type === "nutrient" ? `n-${h.key}` : `b-${h.id}`;
}

export function SearchBar({ className }: { className?: string }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [isMac, setIsMac] = useState(true);
  const input = useRef<HTMLInputElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const listId = useId();
  const hits = useMemo(() => search(q), [q]);
  const st = useApp;

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest?.("input, textarea, [contenteditable=true]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        input.current?.focus();
        input.current?.select();
        setOpen(true);
      }
    };
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, []);

  useEffect(() => setCursor(0), [q]);

  const choose = (h: SearchHit) => {
    const s = st.getState();
    if (h.type === "fruit") {
      s.setNutrientFocus(null);
      s.setFruit(h.fruit.id);
    } else if (h.type === "nutrient") {
      s.setNutrientFocus({ key: h.key, label: h.label });
      s.setFruit(h.ranked[0].fruit.id);
    } else {
      s.setBenefit(h.id);
    }
    setOpen(false);
    setQ("");
    input.current?.blur();
    scrollToId("top");
  };

  const askAI = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setOpen(false);
    setQ("");
    input.current?.blur();
    st.getState().askCopilot(trimmed);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setCursor((c) => Math.min(c + 1, Math.max(0, hits.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (hits[cursor] && q.trim().split(/\s+/).length <= 2) choose(hits[cursor]);
      else if (q.trim()) askAI(q);
    } else if (e.key === "Escape") {
      if (q) setQ("");
      else {
        setOpen(false);
        input.current?.blur();
      }
    }
  };

  const showPanel = open && (focused || q.length > 0);

  return (
    <div ref={wrap} className={cn("relative", className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (hits[cursor] && q.trim().split(/\s+/).length <= 2) choose(hits[cursor]);
          else if (q.trim()) askAI(q);
          else input.current?.focus();
        }}
        className={cn(
          "relative flex h-[48px] items-center rounded-2xl border bg-white/95 pr-1.5 pl-3.5 shadow-[0_10px_30px_-18px_rgb(18_10_20/0.45)] transition-[border-color,box-shadow] duration-200",
          focused ? "border-ink/60 shadow-[0_14px_40px_-16px_rgb(18_10_20/0.45)]" : "border-ink/12",
        )}
      >
        <Search aria-hidden className="mr-2.5 size-4 shrink-0 text-ink/55" />
        <label htmlFor={`${listId}-input`} className="sr-only">
          Search fruit, nutrient, or ask AI
        </label>
        <input
          id={`${listId}-input`}
          ref={input}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
          placeholder="Search fruit, nutrient, or ask AI…"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={`${listId}-list`}
          aria-activedescendant={showPanel && hits[cursor] ? `${listId}-${hitKey(hits[cursor])}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
          className="h-full min-w-0 flex-1 bg-transparent text-[14.5px] font-medium text-ink placeholder:font-normal placeholder:text-ink/50 outline-none focus-visible:outline-none"
        />
        <kbd className="mx-2 hidden shrink-0 rounded-md border border-ink/12 px-1.5 py-0.5 font-mono text-[10px] text-ink/55 sm:block">
          {isMac ? "⌘K" : "Ctrl K"}
        </kbd>
        <button type="submit" data-magnetic className="on-dark h-9 shrink-0 rounded-xl bg-ink px-3.5 text-[13px] font-semibold text-white transition-transform active:scale-95">
          {q.trim().split(/\s+/).length > 2 ? "Ask AI" : "Search"}
        </button>
      </form>

      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } }}
            transition={SPRING}
            className="absolute inset-x-0 top-[calc(100%+8px)] z-50 origin-top overflow-hidden rounded-2xl border border-ink/10 bg-paper/98 shadow-[0_30px_60px_-24px_rgb(18_10_20/0.55)] backdrop-blur-xl"
          >
            {q.length === 0 ? (
              <div className="p-3">
                <p className="px-1 pb-2 font-mono text-[10px] tracking-[0.08em] text-ink/50 uppercase">Try</p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGEST.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setQ(s)}
                      className="rounded-full border border-ink/12 px-3 py-1 text-[13px] text-ink/80 hover:bg-ink hover:text-white"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-1.5">
                {hits.length > 0 && (
                  <ul id={`${listId}-list`} role="listbox" aria-label="Search results" data-lenis-prevent className="max-h-[min(50vh,340px)] overflow-y-auto">
                    {hits.map((h, i) => (
                      <li
                        key={hitKey(h)}
                        id={`${listId}-${hitKey(h)}`}
                        role="option"
                        aria-selected={i === cursor}
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseEnter={() => setCursor(i)}
                        onClick={() => choose(h)}
                        className="relative cursor-pointer rounded-xl px-3 py-2.5"
                      >
                        {i === cursor && <motion.span layoutId={`${listId}-hl`} transition={SPRING} className="absolute inset-0 -z-0 rounded-xl bg-ink/[0.06]" />}
                        <HitRow hit={h} />
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => askAI(q)}
                  className="mt-1 flex w-full items-center gap-2.5 rounded-xl bg-ink/[0.05] px-3 py-2.5 text-left text-[13.5px] font-semibold text-ink transition-colors hover:bg-ink hover:text-white"
                >
                  <Sparkles className="size-4 shrink-0 text-[var(--accent)]" aria-hidden />
                  <span className="truncate">Ask AI Copilot: “{q}”</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HitRow({ hit }: { hit: SearchHit }) {
  const kind = hit.type === "fruit" ? "Fruit" : hit.type === "nutrient" ? "Nutrient" : "Benefit";
  return (
    <div className="relative flex items-start gap-3">
      <span className="mt-0.5 w-[68px] shrink-0 font-mono text-[9.5px] tracking-[0.06em] text-ink/45 uppercase">{kind}</span>
      <div className="min-w-0">
        {hit.type === "fruit" && (
          <p className="text-[14.5px] font-semibold text-ink">
            {hit.fruit.name} <span className="font-serif text-[15px] font-normal text-ink/60 italic">{hit.fruit.binomial}</span>
          </p>
        )}
        {hit.type === "nutrient" && (
          <>
            <p className="text-[14.5px] font-semibold text-ink">{hit.label}</p>
            <p className="mt-0.5 text-[12.5px] leading-snug text-ink/60">
              Richest: {hit.ranked.slice(0, 3).map((r) => `${r.fruit.name} (${r.detail})`).join(", ")}
            </p>
          </>
        )}
        {hit.type === "benefit" && (
          <>
            <p className="text-[14.5px] font-semibold text-ink">{hit.label}</p>
            <p className="mt-0.5 text-[12.5px] text-ink/60">{hit.fruits.map((f) => f.name).join(", ")}</p>
          </>
        )}
      </div>
    </div>
  );
}
