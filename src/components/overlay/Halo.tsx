"use client";

import { useEffect, useRef } from "react";
import { anchors, onAnchors } from "@/lib/store";

/** Dark blurred spotlight that tracks the fruit so it separates cleanly from the bright aurora. */
export function Halo() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(
    () =>
      onAnchors(() => {
        const c = anchors.center;
        const el = ref.current;
        if (!c || !el) return;
        el.style.transform = `translate3d(${c.x}px, ${c.y}px, 0) translate(-50%, -50%)`;
      }),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        ref={ref}
        className="halo absolute top-0 left-0 aspect-square w-[min(130vw,1100px)] will-change-transform md:w-[min(112vh,1180px)]"
        style={{ transform: "translate3d(50vw, 50vh, 0) translate(-50%, -50%)" }}
      />
    </div>
  );
}
