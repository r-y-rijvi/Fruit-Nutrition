"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { useRef } from "react";
import { CalloutOverlay } from "@/components/overlay/CalloutOverlay";
import { BenefitPills, FruitDock } from "@/components/overlay/FruitDock";
import { Halo } from "@/components/overlay/Halo";
import { HeroActions, HeroTitle } from "@/components/overlay/HeroText";
import { MobileCallouts } from "@/components/overlay/MobileCallouts";
import { Nav } from "@/components/sections/Nav";
import { NutritionPanel } from "@/components/sections/NutritionPanel";
import { Footer, Sources } from "@/components/sections/Sources";
import { Synergies } from "@/components/sections/Synergies";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { Cursor, FloatingTooltip } from "@/components/ui/Cursor";
import { useIsWide } from "@/hooks/useMedia";
import { useAccentVar, useCitationLinks, useHeroKeys, useHeroVisibility, useLenis } from "@/hooks/usePageEffects";
import { useApp } from "@/lib/store";

const Stage = dynamic(() => import("@/components/three/Stage"), { ssr: false, loading: () => <StageLoading /> });

const SPRING = { type: "spring" as const, stiffness: 280, damping: 24 };

export default function Page() {
  const hero = useRef<HTMLElement>(null);
  const view = useApp((s) => s.view);
  const wide = useIsWide();
  useLenis();
  useHeroKeys();
  useHeroVisibility(hero);
  useAccentVar();
  useCitationLinks();

  return (
    <>
      <AuroraBackground />
      <Nav />
      <main>
        <section ref={hero} id="top" aria-label="3D fruit specimen" className="relative h-[100svh] min-h-[620px] overflow-hidden">
          <Halo />
          <div className="absolute inset-0 z-10">
            <Stage />
          </div>
          <CalloutOverlay />

          <div className="pointer-events-none absolute inset-0 z-30 flex flex-col pt-[116px] min-[900px]:pt-[76px]">
            <div className="flex min-h-0 flex-1 flex-col px-5 min-[900px]:justify-center min-[900px]:px-10 min-[900px]:pb-[132px] xl:px-16">
              <div className="pointer-events-auto w-fit max-w-full">
                <HeroTitle />
                <HeroActions className="mt-7 max-[899px]:hidden" />
              </div>
            </div>

            <div className="flex flex-col items-center gap-2.5 pb-3 min-[900px]:pb-5">
              <HeroActions className="pointer-events-auto items-center px-5 min-[900px]:hidden" />
              {!wide && view === "layers" && <MobileCallouts className="pointer-events-auto" />}
              <AnimatePresence initial={false}>
                {view === "whole" && (
                  <motion.div
                    key="pills"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10, transition: { duration: 0.15 } }}
                    transition={SPRING}
                    className="max-w-full"
                  >
                    <BenefitPills className="pointer-events-auto px-5" />
                  </motion.div>
                )}
              </AnimatePresence>
              <FruitDock className="pointer-events-auto max-w-full px-3" />
            </div>
          </div>
        </section>

        <div className="relative z-10 rounded-t-[32px] bg-paper shadow-[0_-30px_60px_-30px_rgb(18_10_20/0.35)] min-[900px]:rounded-t-[44px]">
          <NutritionPanel />
          <Synergies />
          <Sources />
          <Footer />
        </div>
      </main>
      <Cursor />
      <FloatingTooltip />
    </>
  );
}

function StageLoading() {
  return (
    <div className="grid h-full place-items-center" role="status">
      <div className="flex flex-col items-center gap-3 text-white/80">
        <span className="size-14 animate-spin rounded-full border-2 border-white/20 border-t-white/90" aria-hidden />
        <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase">Growing specimen…</span>
      </div>
    </div>
  );
}
