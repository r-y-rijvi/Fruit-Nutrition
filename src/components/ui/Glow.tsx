"use client";

import { motion, useMotionValue, useSpring, useTransform, type HTMLMotionProps } from "motion/react";
import { forwardRef, useRef } from "react";
import { cn } from "@/lib/utils";

const SPRING = { stiffness: 280, damping: 24, mass: 0.5 };

/** Pulls its content toward the pointer while hovered, then springs home. */
export function Magnetic({ children, strength = 0.28, className }: { children: React.ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const x = useSpring(useMotionValue(0), SPRING);
  const y = useSpring(useMotionValue(0), SPRING);
  return (
    <motion.span
      ref={ref}
      className={cn("inline-flex", className)}
      style={{ x, y }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}

type GlowProps = Omit<HTMLMotionProps<"button">, "children"> & { children?: React.ReactNode; tone?: "ink" | "light" };

/** Pill button with a conic glow ring that follows the pointer angle. */
export const GlowButton = forwardRef<HTMLButtonElement, GlowProps>(function GlowButton({ className, tone = "ink", children, ...rest }, fwd) {
  const angle = useMotionValue(200);
  const ring = useTransform(angle, conic);
  return (
    <motion.button
      ref={fwd}
      data-magnetic
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", ...SPRING }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        angle.set((Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI + 90);
      }}
      className={cn(
        "group relative isolate inline-flex h-12 items-center gap-2.5 rounded-full px-6 text-[15px] font-semibold",
        tone === "ink" ? "on-dark text-white" : "text-ink",
        className,
      )}
      {...rest}
    >
      <motion.span
        aria-hidden
        className="absolute -inset-[2px] -z-20 rounded-full opacity-70 blur-[6px] transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: ring }}
      />
      <motion.span
        aria-hidden
        className="absolute -inset-[1.5px] -z-10 rounded-full"
        style={{ background: ring }}
      />
      <span aria-hidden className={cn("absolute inset-0 -z-10 rounded-full", tone === "ink" ? "bg-ink" : "bg-paper")} />
      {children}
    </motion.button>
  );
});

function conic(a: number) {
  return `conic-gradient(from ${a}deg, #FFB627, #FF7A1A, #E8247C, #2FBF71, #FFB627)`;
}
