"use client";

import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";
import { FRUIT_BY_ID } from "@/data";
import { useFinePointer } from "@/hooks/useMedia";
import { useApp } from "@/lib/store";

const SPRING = { stiffness: 280, damping: 24, mass: 0.6 };

/** Custom cursor: an instant dot plus a spring ring that is pulled onto [data-magnetic] hotspots. */
export function Cursor() {
  const fine = useFinePointer();
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const rx = useSpring(x, SPRING);
  const ry = useSpring(y, SPRING);
  const w = useSpring(34, SPRING);
  const h = useSpring(34, SPRING);
  const radius = useSpring(17, SPRING);
  const [mode, setMode] = useState<"idle" | "hot" | "text" | "hidden">("hidden");
  const hoverFruit = useApp((s) => s.hoverFruit || s.hoverLayer !== null);

  useEffect(() => {
    if (!fine) return;
    document.documentElement.dataset.cursor = "on";
    let raf = 0;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x.set(e.clientX);
      y.set(e.clientY);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const t = e.target as Element | null;
        const mag = t?.closest?.("[data-magnetic]") as HTMLElement | null;
        const field = t?.closest?.("input, textarea");
        if (mag) {
          const r = mag.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          rx.set(cx + (e.clientX - cx) * 0.18);
          ry.set(cy + (e.clientY - cy) * 0.18);
          w.set(r.width + 14);
          h.set(r.height + 10);
          radius.set(Math.min(r.height / 2 + 5, 22));
          setMode("hot");
        } else {
          rx.set(e.clientX);
          ry.set(e.clientY);
          const interactive = t?.closest?.("a, button, [role=button], [role=option], label");
          const s = field ? 6 : interactive ? 46 : 34;
          w.set(field ? 3 : s);
          h.set(field ? 26 : s);
          radius.set(field ? 2 : s / 2);
          setMode(field ? "text" : "idle");
        }
      });
    };
    const leave = () => setMode("hidden");
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      delete document.documentElement.dataset.cursor;
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(raf);
    };
  }, [fine, x, y, rx, ry, w, h, radius]);

  if (!fine) return null;
  const hidden = mode === "hidden";
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100]">
      <motion.div
        className="absolute top-0 left-0 border-[1.5px] border-white mix-blend-difference"
        style={{ x: rx, y: ry, width: w, height: h, borderRadius: radius, translateX: "-50%", translateY: "-50%" }}
        animate={{ opacity: hidden ? 0 : 1, backgroundColor: mode === "hot" ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0)", scale: hoverFruit && mode === "idle" ? 1.9 : 1 }}
        transition={{ type: "spring", ...SPRING }}
      />
      <motion.div
        className="absolute top-0 left-0 size-[6px] rounded-full bg-white mix-blend-difference"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
        animate={{ opacity: hidden || mode === "text" ? 0 : 1 }}
      />
    </div>
  );
}

/** Tooltip that floats beside the cursor while the pointer is over the 3D fruit. */
export function FloatingTooltip() {
  const view = useApp((s) => s.view);
  const busy = useApp((s) => s.busy);
  const hoverFruit = useApp((s) => s.hoverFruit);
  const hoverLayer = useApp((s) => s.hoverLayer);
  const activeLayer = useApp((s) => s.activeLayer);
  const fruitId = useApp((s) => s.fruitId);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, SPRING);
  const sy = useSpring(y, SPRING);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      x.set(e.clientX + 22);
      y.set(e.clientY + 22);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [x, y]);

  let text: string | null = null;
  if (!busy && view === "whole" && hoverFruit) text = "Click fruit to slice open & inspect layer nutrition";
  if (!busy && view === "layers" && hoverLayer) {
    const l = FRUIT_BY_ID[fruitId].layers.find((k) => k.key === hoverLayer)!;
    text = hoverLayer === activeLayer ? `${l.role} — showing nutrients` : `Click to inspect the ${l.role.toLowerCase()}`;
  }

  return (
    <motion.div aria-hidden className="pointer-events-none fixed top-0 left-0 z-[90]" style={{ x: sx, y: sy }}>
      <AnimatePresence>
        {text && (
          <motion.div
            key={text}
            initial={{ opacity: 0, scale: 0.9, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.12 } }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="max-w-[240px] origin-top-left rounded-xl border border-white/12 bg-ink/85 px-3 py-2 text-[12.5px] leading-snug font-medium text-white shadow-lg backdrop-blur-md"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
