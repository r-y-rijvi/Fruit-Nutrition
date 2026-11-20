import { Vector2 } from "three";

export interface Ellipse {
  rx: number;
  ry: number;
  /** >0 widens the bottom (pear/avocado), <0 widens the shoulders. */
  pear?: number;
  topDimple?: number;
  bottomDimple?: number;
  y?: number;
}

export type BeadLayout = "arils" | "cavity" | "pips" | "ring";

export interface FruitShape {
  outer: Ellipse;
  /** Peel thickness as a fraction of radius — exaggerated slightly so thin skins stay legible. */
  peel: number;
  pit: Ellipse;
  zScale: number;
  lifeSize: string;
  skin: string[];
  skinMat: { roughness: number; clearcoat: number; clearcoatRoughness: number; sheen: number; sheenColor: string; bumpScale: number };
  peelInner: string;
  flesh: [string, string];
  pitColors: [string, string];
  sss: string;
  extras: { stem?: boolean; leaf?: boolean; crown?: "pomegranate" | "calyx" };
  beads?: { piece: "flesh" | "core"; count: number; size: number; colors: [string, string]; layout: BeadLayout };
}

export const SHAPES: Record<string, FruitShape> = {
  mango: {
    outer: { rx: 0.92, ry: 1.18, pear: -0.08 },
    peel: 0.035,
    pit: { rx: 0.4, ry: 0.86, y: 0.02 },
    zScale: 0.8,
    lifeSize: "≈ 12 cm long",
    skin: ["#FFC23D", "#7DB843", "#F25C54", "#FFB627"],
    skinMat: { roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.5, sheen: 0, sheenColor: "#ffffff", bumpScale: 0.6 },
    peelInner: "#FFB347",
    flesh: ["#FFA21F", "#FF8A00"],
    pitColors: ["#E9DCC0", "#C9B48A"],
    sss: "#FF8A1E",
    extras: { stem: true },
  },
  orange: {
    outer: { rx: 1.08, ry: 1.02 },
    peel: 0.085,
    pit: { rx: 0.2, ry: 0.62 },
    zScale: 1,
    lifeSize: "≈ 7.5 cm across",
    skin: ["#FF8C1A", "#F26B0F", "#FFA53D"],
    skinMat: { roughness: 0.55, clearcoat: 0.25, clearcoatRoughness: 0.4, sheen: 0, sheenColor: "#ffffff", bumpScale: 1.6 },
    peelInner: "#FFF3DC",
    flesh: ["#FF9A2E", "#FFB84D"],
    pitColors: ["#FFF1D6", "#F5DDB0"],
    sss: "#FF7A00",
    extras: { stem: true },
  },
  avocado: {
    outer: { rx: 0.86, ry: 1.22, pear: 0.28 },
    peel: 0.035,
    pit: { rx: 0.43, ry: 0.5, y: -0.2 },
    zScale: 1,
    lifeSize: "≈ 10 cm long",
    skin: ["#2F3B1C", "#4E5B23", "#1E2712"],
    skinMat: { roughness: 0.78, clearcoat: 0.1, clearcoatRoughness: 0.6, sheen: 0, sheenColor: "#ffffff", bumpScale: 2.6 },
    peelInner: "#6E8B2E",
    flesh: ["#C9E265", "#EAF29A"],
    pitColors: ["#8B5A35", "#B07A4F"],
    sss: "#7FB800",
    extras: { stem: true },
  },
  kiwi: {
    outer: { rx: 0.82, ry: 1.12 },
    peel: 0.035,
    pit: { rx: 0.3, ry: 0.85 },
    zScale: 0.9,
    lifeSize: "≈ 6.5 cm long",
    skin: ["#8A5A2B", "#6B4423", "#A57540"],
    skinMat: { roughness: 0.95, clearcoat: 0, clearcoatRoughness: 1, sheen: 1, sheenColor: "#C9A57A", bumpScale: 1.2 },
    peelInner: "#5FA83A",
    flesh: ["#6CC04A", "#A6DB6A"],
    pitColors: ["#F4F1D0", "#E6E2B4"],
    sss: "#8BD13F",
    extras: {},
    beads: { piece: "core", count: 54, size: 0.022, colors: ["#111111", "#2A1E12"], layout: "ring" },
  },
  pomegranate: {
    outer: { rx: 1.1, ry: 1.0 },
    peel: 0.09,
    pit: { rx: 0.38, ry: 0.55 },
    zScale: 1,
    lifeSize: "≈ 9 cm across",
    skin: ["#C1121F", "#E85D4A", "#8E0E1A", "#E8A15A"],
    skinMat: { roughness: 0.48, clearcoat: 0.4, clearcoatRoughness: 0.35, sheen: 0, sheenColor: "#ffffff", bumpScale: 0.5 },
    peelInner: "#F6E7C8",
    flesh: ["#B5172F", "#E63950"],
    pitColors: ["#F3E3C3", "#E8D2A8"],
    sss: "#FF2D55",
    extras: { crown: "pomegranate" },
    beads: { piece: "flesh", count: 72, size: 0.07, colors: ["#B5172F", "#E63950"], layout: "arils" },
  },
  blueberry: {
    outer: { rx: 1.05, ry: 0.88 },
    peel: 0.05,
    pit: { rx: 0.32, ry: 0.28 },
    zScale: 1,
    lifeSize: "≈ 1.5 cm across — shown ×6",
    skin: ["#2E3F8F", "#1C2766", "#9FB1E0"],
    skinMat: { roughness: 0.62, clearcoat: 0, clearcoatRoughness: 1, sheen: 0.9, sheenColor: "#B8C6EE", bumpScale: 0.3 },
    peelInner: "#5B3B8C",
    flesh: ["#C9D7A8", "#7A4C9E"],
    pitColors: ["#E8E2C0", "#B9A97A"],
    sss: "#5B5BD6",
    extras: { crown: "calyx" },
  },
  apple: {
    outer: { rx: 1.05, ry: 0.98, topDimple: 0.22, bottomDimple: 0.12, pear: -0.06 },
    peel: 0.03,
    pit: { rx: 0.32, ry: 0.45, y: 0.02 },
    zScale: 1,
    lifeSize: "≈ 8 cm across",
    skin: ["#D62828", "#F6BD60", "#9E1B1B", "#B8D86B"],
    skinMat: { roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.18, sheen: 0, sheenColor: "#ffffff", bumpScale: 0.25 },
    peelInner: "#FFF6E0",
    flesh: ["#FFF4D6", "#F6E6B4"],
    pitColors: ["#EFE3B8", "#D9C78E"],
    sss: "#FF5A5F",
    extras: { stem: true, leaf: true },
    beads: { piece: "core", count: 4, size: 0.07, colors: ["#5A3A22", "#7A4E2E"], layout: "pips" },
  },
  papaya: {
    outer: { rx: 0.82, ry: 1.35, pear: 0.22 },
    peel: 0.035,
    pit: { rx: 0.42, ry: 0.82, y: -0.08 },
    zScale: 1,
    lifeSize: "≈ 15 cm long",
    skin: ["#9BC53D", "#FFB627", "#6F9A2C"],
    skinMat: { roughness: 0.4, clearcoat: 0.3, clearcoatRoughness: 0.4, sheen: 0, sheenColor: "#ffffff", bumpScale: 0.4 },
    peelInner: "#FFB36B",
    flesh: ["#FF8A5B", "#FF6F4D"],
    pitColors: ["#3A2A1E", "#1A1410"],
    sss: "#FF7A50",
    extras: { stem: true },
    beads: { piece: "core", count: 70, size: 0.06, colors: ["#1A1410", "#3A2A1E"], layout: "cavity" },
  },
};

/** Lathe profile from bottom pole to top pole as [radius, height] points. */
export function profile(e: Ellipse, n = 72): Vector2[] {
  const pts: Vector2[] = [];
  for (let i = 0; i <= n; i++) {
    const th = -Math.PI / 2 + (Math.PI * i) / n;
    const s = Math.sin(th);
    const c = Math.cos(th);
    const r = Math.max(0, c * e.rx * (1 + (e.pear ?? 0) * -s));
    let y = s * e.ry;
    const g = Math.pow(1 - Math.min(1, r / e.rx), 3);
    if (s > 0 && e.topDimple) y -= e.topDimple * e.ry * g;
    if (s < 0 && e.bottomDimple) y += e.bottomDimple * e.ry * g;
    pts.push(new Vector2(r, y + (e.y ?? 0)));
  }
  return pts;
}

export function insetProfile(pts: Vector2[], k: number, cy = 0): Vector2[] {
  return pts.map((p) => new Vector2(p.x * k, cy + (p.y - cy) * k));
}
