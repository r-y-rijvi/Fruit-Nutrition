"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useEffect, useRef } from "react";
import { FRUIT_BY_ID } from "@/data";
import type { LayerKey } from "@/data/types";
import { useIsWide } from "@/hooks/useMedia";
import { anchors, onAnchors, useApp } from "@/lib/store";
import { clamp, cn } from "@/lib/utils";
import { NutrientCard } from "./NutrientCard";

gsap.registerPlugin(useGSAP);

interface Target { key: string; layer?: LayerKey; title: string; short: string }

const STACK_W = 304;

export function CalloutOverlay() {
  const fruitId = useApp((s) => s.fruitId);
  const view = useApp((s) => s.view);
  const activeLayer = useApp((s) => s.activeLayer);
  const hoverLayer = useApp((s) => s.hoverLayer);
  const busy = useApp((s) => s.busy);
  const benefit = useApp((s) => s.benefit);
  const setActiveLayer = useApp((s) => s.setActiveLayer);
  const setHoverLayer = useApp((s) => s.setHoverLayer);
  const wide = useIsWide();

  const fruit = FRUIT_BY_ID[fruitId];
  const targets: Target[] =
    view === "whole"
      ? [{ key: "whole", title: fruit.name, short: fruit.name }]
      : fruit.layers.map((l) => ({ key: l.key, layer: l.key, title: `${l.role} • ${l.botanical}`, short: l.role }));
  const activeKey = view === "whole" ? "whole" : activeLayer;
  const layer = view === "layers" ? fruit.layers.find((l) => l.key === activeLayer)! : null;
  const blocks = layer ? layer.nutrients : fruit.whole;

  const root = useRef<HTMLDivElement>(null);
  const lines = useRef<Record<string, SVGPathElement | null>>({});
  const dots = useRef<Record<string, SVGGElement | null>>({});
  const titles = useRef<Record<string, HTMLElement | null>>({});
  const bracket = useRef<SVGPathElement>(null);
  const ends = useRef<SVGGElement>(null);
  const stack = useRef<HTMLDivElement>(null);
  const box = useRef({ w: 0, h: 0, stackH: 0, top: null as number | null });
  const keysRef = useRef({ activeKey, keys: targets.map((t) => t.key), wide });
  keysRef.current = { activeKey, keys: targets.map((t) => t.key), wide };

  useEffect(() => {
    const ro = new ResizeObserver(() => {
      if (root.current) {
        box.current.w = root.current.clientWidth;
        box.current.h = root.current.clientHeight;
      }
      if (stack.current) box.current.stackH = stack.current.offsetHeight;
    });
    if (root.current) ro.observe(root.current);
    if (stack.current) ro.observe(stack.current);
    return () => ro.disconnect();
  }, [wide]);

  useEffect(() => {
    box.current.top = null;
  }, [fruitId, view, activeLayer]);

  useEffect(
    () =>
      onAnchors(() => {
        const { activeKey: ak, keys, wide: w } = keysRef.current;
        const act = anchors[ak];
        const edge = anchors.edge;
        const el = root.current;
        if (!el || !act || !edge) return;
        const ready = act.visible ? "1" : "0";
        if (el.dataset.ready !== ready) el.dataset.ready = ready;
        if (!act.visible) return;

        const { w: W, h: H, stackH } = box.current;
        const bx = clamp(edge.x + 64, act.x + 96, W - STACK_W - 36);
        for (const k of keys) {
          const a = anchors[k];
          if (!a) continue;
          const isActive = k === ak && w;
          const x1 = isActive ? bx : a.x + (w ? 64 : 44);
          lines.current[k]?.setAttribute("d", `M${a.x + 4} ${a.y} H${x1}`);
          dots.current[k]?.setAttribute("transform", `translate(${a.x} ${a.y})`);
          const t = titles.current[k];
          if (t) t.style.transform = `translate3d(${a.x + 14}px, ${a.y - 30}px, 0)`;
        }
        if (!w || !stack.current || !bracket.current || !ends.current) return;
        const want = clamp(act.y - stackH / 2, 84, Math.max(84, H - stackH - 150));
        const cur = box.current.top;
        if (cur === null || Math.abs(cur - want) > 26 || act.y < cur + 8 || act.y > cur + stackH - 8) box.current.top = want;
        const top = box.current.top!;
        bracket.current.setAttribute("d", `M${bx} ${top} V${top + stackH}`);
        ends.current.setAttribute("transform", `translate(${bx} ${top})`);
        (ends.current.lastElementChild as SVGCircleElement).setAttribute("cy", String(stackH));
        stack.current.style.transform = `translate3d(${bx + 22}px, ${top}px, 0)`;
      }),
    [],
  );

  const drawKey = `${fruitId}|${view}|${activeKey}|${busy ? 0 : 1}|${wide ? 1 : 0}`;
  useGSAP(
    () => {
      const el = root.current!;
      const q = gsap.utils.selector(el);
      if (busy) {
        gsap.to(q("[data-draw]"), { opacity: 0, duration: 0.15, overwrite: true });
        return;
      }
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      const add = (targets: Element[], from: gsap.TweenVars, to: gsap.TweenVars, at: number) => {
        if (targets.length) tl.fromTo(targets, from, to, at);
      };
      const activeLine = lines.current[activeKey];
      const otherLines = Object.entries(lines.current).filter(([k, v]) => k !== activeKey && v).map(([, v]) => v!);
      tl.set(q("[data-draw]"), { opacity: 1 });
      add(q("[data-dot]"), { scale: 0 }, { scale: 1, duration: 0.35, stagger: 0.06, transformOrigin: "center", ease: "back.out(2.4)" }, 0);
      add(otherLines, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.45 }, 0.08);
      add(activeLine ? [activeLine] : [], { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, ease: "power2.inOut" }, 0.12);
      add(q("[data-title]"), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.05 }, 0.25);
      if (wide) {
        add(bracket.current ? [bracket.current] : [], { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.45, ease: "power2.out" }, 0.62);
        add(q("[data-end]"), { scale: 0 }, { scale: 1, duration: 0.3, stagger: 0.12, transformOrigin: "center", ease: "back.out(3)" }, 0.66);
        add(q("[data-stack-item]"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 }, 0.72);
      }
      if (still) tl.progress(1);
    },
    { scope: root, dependencies: [drawKey], revertOnUpdate: false },
  );

  return (
    <div ref={root} data-ready="0" className="on-dark pointer-events-none absolute inset-0 z-20 transition-opacity duration-200 data-[ready=0]:opacity-0" aria-live="polite">
      <svg className="callout-line absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        {targets.map((t) => {
          const on = t.key === activeKey;
          const hover = hoverLayer !== null && t.layer === hoverLayer;
          return (
            <g key={`${fruitId}-${t.key}`} data-draw>
              <path
                ref={(n) => {
                  lines.current[t.key] = n;
                }}
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1}
                fill="none"
                stroke="#fff"
                strokeWidth={hover ? 2.25 : 1.5}
                strokeOpacity={on || hover ? 1 : 0.6}
                className="transition-[stroke-width,stroke-opacity] duration-200"
              />
              <g
                ref={(n) => {
                  dots.current[t.key] = n;
                }}
              >
                <circle r={4} fill="none" stroke="#fff" strokeWidth={1.2} className="pulse-ring" />
                <circle data-dot r={4} fill="#fff" />
              </g>
            </g>
          );
        })}
        {wide && (
          <g data-draw>
            <path ref={bracket} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1} fill="none" stroke="#fff" strokeWidth={1.5} />
            <g ref={ends}>
              <circle data-end r={2.5} fill="#fff" />
              <circle data-end r={2.5} cy={0} fill="#fff" />
            </g>
          </g>
        )}
      </svg>

      {targets.map((t) => {
        const on = t.key === activeKey;
        const ref = (n: HTMLElement | null) => {
          titles.current[t.key] = n;
        };
        if (!t.layer)
          return (
            <div key={`${fruitId}-${t.key}`} ref={ref} data-draw className="absolute top-0 left-0 text-[17px] font-medium whitespace-nowrap text-white">
              <span data-title className="block">
                {t.title}
              </span>
            </div>
          );
        return (
          <button
            key={`${fruitId}-${t.key}`}
            ref={ref}
            type="button"
            data-draw
            data-magnetic
            aria-pressed={on}
            onClick={() => setActiveLayer(t.layer!)}
            onPointerEnter={() => setHoverLayer(t.layer!)}
            onPointerLeave={() => setHoverLayer(null)}
            onFocus={() => setHoverLayer(t.layer!)}
            onBlur={() => setHoverLayer(null)}
            className={cn(
              "pointer-events-auto absolute top-0 left-0 -mx-1.5 -my-1 rounded-md px-1.5 py-1 whitespace-nowrap text-white transition-[color,opacity] duration-200",
              on ? "text-[15px] font-medium" : "text-[13px] font-medium text-white/70 hover:text-white",
            )}
          >
            <span data-title className="block">
              {on && wide ? t.title : t.short}
            </span>
          </button>
        );
      })}

      {wide && (
        <div
          ref={stack}
          data-draw
          className="pointer-events-auto absolute top-0 left-0 rounded-2xl border border-white/10 bg-ink/62 p-4 pb-3 shadow-[0_24px_60px_-20px_rgb(18_10_20/0.7)] backdrop-blur-xl"
          style={{ width: STACK_W }}
        >
          <p data-stack-item className="mb-3 font-mono text-[9.5px] tracking-[0.08em] text-white/55 uppercase">
            {layer ? layer.edible : "Whole fruit · per 100 g raw"}
          </p>
          <div className="flex flex-col gap-3.5">
            {blocks.map((b) => (
              <div key={`${fruitId}-${activeKey}-${b.id}`} data-stack-item>
                <NutrientCard block={b} benefit={benefit} />
              </div>
            ))}
          </div>
          {layer?.note && (
            <p data-stack-item className="mt-3.5 border-t border-white/10 pt-2.5 text-[11.5px] leading-snug text-white/55">
              {layer.note}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
