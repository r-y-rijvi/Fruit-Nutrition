"use client";

import gsap from "gsap";
import Lenis from "lenis";
import { useEffect } from "react";
import { FRUIT_BY_ID } from "@/data";
import { scrollToId, setLenis } from "@/lib/scroll";
import { spin, useApp } from "@/lib/store";

export function useLenis() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
    setLenis(lenis);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenis(null);
    };
  }, []);
}

/** Esc reassembles, ←/→ spin the fruit while the hero is on screen. */
export function useHeroKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.closest?.("input, textarea, select, [contenteditable=true], [role=tablist], [role=radiogroup], [role=listbox]")) return;
      const st = useApp.getState();
      if (!st.heroVisible) return;
      if (e.key === "Escape" && st.view === "layers") {
        st.reassemble();
      } else if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && st.view === "whole") {
        e.preventDefault();
        spin.velocity = (e.key === "ArrowLeft" ? -1 : 1) * 0.08;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

export function useHeroVisibility(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => useApp.getState().setHeroVisible(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
}

export function useAccentVar() {
  useEffect(() => {
    const apply = (id: string) => document.documentElement.style.setProperty("--accent", FRUIT_BY_ID[id].accent);
    apply(useApp.getState().fruitId);
    return useApp.subscribe((s, p) => {
      if (s.fruitId !== p.fruitId) apply(s.fruitId);
    });
  }, []);
}

/** Smooth-scrolls in-page citation links and briefly highlights the cited entry. */
export function useCitationLinks() {
  useEffect(() => {
    const timers = new Map<Element, number>();
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as HTMLElement).closest?.('a[href^="#src-"]');
      if (!a) return;
      const id = a.getAttribute("href")!.slice(1);
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      scrollToId(id);
      el.setAttribute("data-flash", "");
      window.clearTimeout(timers.get(el));
      timers.set(el, window.setTimeout(() => el.removeAttribute("data-flash"), 1800));
    };
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);
}
