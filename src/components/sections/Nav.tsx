"use client";

import { LayoutGroup, motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { SearchBar } from "@/components/overlay/SearchBar";
import { scrollToId } from "@/lib/scroll";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const SPRING = { type: "spring" as const, stiffness: 280, damping: 24 };
const LINKS = [
  { id: "top", label: "Specimen" },
  { id: "nutrition", label: "Nutrition" },
  { id: "pairings", label: "Pairings" },
  { id: "sources", label: "Sources" },
];

export function Nav() {
  const [hover, setHover] = useState<string | null>(null);
  const [active, setActive] = useState("top");
  const [scrolled, setScrolled] = useState(false);
  const setCopilotOpen = useApp((s) => s.setCopilotOpen);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const seen = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => seen.set(e.target.id, e.isIntersecting));
        const first = LINKS.find((l) => seen.get(l.id));
        if (first) setActive(first.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    LINKS.forEach((l) => {
      const el = document.getElementById(l.id);
      if (el) io.observe(el);
    });
    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b border-ink/8 backdrop-blur-xl transition-[background-color,box-shadow] duration-300",
        scrolled ? "bg-paper/92 shadow-[0_6px_24px_-16px_rgb(18_10_20/0.3)]" : "bg-paper/78",
      )}
    >
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-4 gap-y-2 px-5 py-2.5 min-[900px]:h-[76px] min-[900px]:flex-nowrap min-[900px]:px-10 min-[900px]:py-0 xl:px-16">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            scrollToId("top");
          }}
          className="group flex shrink-0 items-center gap-2 text-ink"
          aria-label="FruitAnatomy 3D, back to top"
        >
          <Mark />
          <span className="font-display text-[14px] font-bold tracking-[-0.02em] min-[900px]:text-[15px]">FruitAnatomy</span>
          <span className="rounded-[5px] bg-ink px-1 py-px font-mono text-[9.5px] font-medium text-white">3D</span>
        </a>

        <LayoutGroup id="nav">
          <nav aria-label="Sections" className="no-scrollbar -mx-2 ml-auto overflow-x-auto min-[900px]:mx-0 min-[900px]:ml-3">
            <ul className="flex items-center" onPointerLeave={() => setHover(null)}>
              {LINKS.map((l) => {
                const on = active === l.id;
                return (
                  <li key={l.id} className={cn(l.id === "top" && "max-[520px]:hidden")}>
                    <a
                      href={`#${l.id}`}
                      data-magnetic
                      aria-current={on ? "location" : undefined}
                      onPointerEnter={() => setHover(l.id)}
                      onFocus={() => setHover(l.id)}
                      onBlur={() => setHover(null)}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToId(l.id);
                      }}
                      className={cn(
                        "relative block rounded-full px-2.5 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors duration-200 min-[900px]:px-3.5",
                        on ? "text-ink" : "text-ink/70 hover:text-ink",
                      )}
                    >
                      {hover === l.id && <motion.span layoutId="nav-hover" transition={SPRING} className="absolute inset-0 rounded-full bg-ink/[0.07]" />}
                      <span className="relative">{l.label}</span>
                      {on && <motion.span layoutId="nav-active" transition={SPRING} className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-ink" />}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </LayoutGroup>

        <button
          type="button"
          onClick={() => setCopilotOpen(true)}
          className="on-dark hidden shrink-0 items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-[12.5px] font-semibold text-white transition-transform hover:scale-[1.02] active:scale-95 min-[1100px]:inline-flex"
        >
          <Sparkles className="size-3.5 text-[var(--accent)]" aria-hidden />
          AI Copilot
        </button>

        <SearchBar className="w-full min-[900px]:ml-auto min-[900px]:w-[min(380px,32vw)]" />
      </div>
    </header>
  );
}

function Mark() {
  return (
    <svg viewBox="0 0 28 28" className="size-7 shrink-0 transition-transform duration-500 group-hover:rotate-[24deg]" aria-hidden>
      <defs>
        <linearGradient id="mark-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFB627" />
          <stop offset="0.5" stopColor="#FF7A1A" />
          <stop offset="1" stopColor="#E8247C" />
        </linearGradient>
      </defs>
      <circle cx="14" cy="15" r="11" fill="url(#mark-g)" />
      <circle cx="14" cy="15" r="7.2" fill="#FFFDF8" fillOpacity="0.9" />
      <circle cx="14" cy="15" r="3" fill="#120A14" />
      <path d="M14 4c1.5-2.4 4-3.2 6.5-2.6-1 2.4-3.4 3.6-6.5 2.6Z" fill="#2FBF71" />
    </svg>
  );
}
