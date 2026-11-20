"use client";

/** Window-level pointer in normalized device coords, readable from render loops without React state. */
export const pointer = { x: 0, y: 0, px: 0, py: 0, active: false };

let bound = false;
export function bindPointer() {
  if (bound || typeof window === "undefined") return;
  bound = true;
  window.addEventListener(
    "pointermove",
    (e) => {
      pointer.px = e.clientX;
      pointer.py = e.clientY;
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
      pointer.active = true;
    },
    { passive: true },
  );
}
