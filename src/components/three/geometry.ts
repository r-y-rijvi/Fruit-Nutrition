import {
  BufferGeometry,
  CatmullRomCurve3,
  ConeGeometry,
  LatheGeometry,
  Matrix4,
  Path,
  Quaternion,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  Euler,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { LayerKey } from "@/data/types";
import { SHAPES, insetProfile, profile, type FruitShape } from "./shapes";

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export interface SectionFrame { cx: number; cy: number; size: number }
export interface PieceBounds { minY: number; maxY: number; maxR: number }

export interface FruitGeometry {
  id: string;
  shape: FruitShape;
  outer: Vector2[];
  inner: Vector2[];
  pit: Vector2[];
  frame: SectionFrame;
  bounds: Record<LayerKey, PieceBounds>;
  eqY: number;
  skinBack: BufferGeometry;
  skinFront: BufferGeometry;
  peelBowl: BufferGeometry;
  fleshOuter: BufferGeometry;
  fleshCavity: BufferGeometry;
  pitOuter: BufferGeometry;
  peelCut: BufferGeometry;
  fleshCut: BufferGeometry;
  pitCut: BufferGeometry;
  lidCut: BufferGeometry;
  stem?: BufferGeometry;
  leaf?: BufferGeometry;
  crown?: BufferGeometry;
  beads?: { piece: "flesh" | "core"; matrices: Matrix4[] };
  anchors: Record<LayerKey, [number, number]>;
}

const SEGMENTS = 64;

function halfLathe(pts: Vector2[], back: boolean, zScale: number, k = 1): BufferGeometry {
  const src = k === 1 ? pts : pts.map((p) => new Vector2(p.x * k, p.y));
  const g = new LatheGeometry(src, SEGMENTS / 2, back ? Math.PI / 2 : -Math.PI / 2, Math.PI);
  const uv = g.attributes.uv;
  const offset = back ? 0.25 : -0.25;
  for (let i = 0; i < uv.count; i++) uv.setX(i, offset + 0.5 * uv.getX(i));
  g.scale(1, 1, zScale);
  return g;
}

function contour(pts: Vector2[]): Vector2[] {
  const out = pts.map((p) => new Vector2(p.x, p.y));
  for (let i = pts.length - 2; i >= 1; i--) out.push(new Vector2(-pts[i].x, pts[i].y));
  return out;
}

function section(outline: Vector2[], hole: Vector2[] | null, frame: SectionFrame): BufferGeometry {
  const s = new Shape(contour(outline));
  if (hole) s.holes.push(new Path(contour(hole)));
  const g = new ShapeGeometry(s);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) - frame.cx) / frame.size + 0.5, (pos.getY(i) - frame.cy) / frame.size + 0.5);
  }
  return g;
}

function bounds(pts: Vector2[]): PieceBounds {
  let minY = Infinity, maxY = -Infinity, maxR = 0;
  for (const p of pts) {
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
    maxR = Math.max(maxR, p.x);
  }
  return { minY, maxY, maxR };
}

export function radiusAt(pts: Vector2[], y: number): number {
  let r = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    if ((a.y - y) * (b.y - y) <= 0 && a.y !== b.y) {
      const t = (y - a.y) / (b.y - a.y);
      r = Math.max(r, a.x + (b.x - a.x) * t);
    }
  }
  return r;
}

function insideProfile(pts: Vector2[], x: number, y: number) {
  return Math.abs(x) < radiusAt(pts, y);
}

function stemGeometry(top: number, lean: number, length: number, radius: number): BufferGeometry {
  const curve = new CatmullRomCurve3([
    new Vector3(0, top - 0.06, 0),
    new Vector3(lean * 0.3, top + length * 0.45, 0),
    new Vector3(lean, top + length, 0.02),
  ]);
  const tube = new TubeGeometry(curve, 16, radius, 8, false);
  const cap = new SphereGeometry(radius, 8, 6);
  cap.translate(lean, top + length, 0.02);
  return mergeGeometries([tube.toNonIndexed(), cap.toNonIndexed()])!;
}

function leafGeometry(top: number): BufferGeometry {
  const s = new Shape();
  s.moveTo(0, 0);
  s.quadraticCurveTo(0.18, 0.12, 0.5, 0.02);
  s.quadraticCurveTo(0.2, -0.14, 0, 0);
  const g = new ShapeGeometry(s, 12);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    pos.setZ(i, -x * x * 0.6 + pos.getY(i) * 0.25);
  }
  g.computeVertexNormals();
  g.rotateZ(0.5);
  g.rotateY(-0.5);
  g.translate(0.04, top + 0.12, 0.02);
  return g;
}

function crownGeometry(kind: "pomegranate" | "calyx", top: number, r: number): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const m = new Matrix4();
  const q = new Quaternion();
  if (kind === "pomegranate") {
    const tube = new LatheGeometry(
      [new Vector2(0.001, top - 0.12), new Vector2(r * 0.95, top - 0.12), new Vector2(r * 0.72, top + 0.06), new Vector2(r * 0.78, top + 0.16), new Vector2(r * 0.7, top + 0.17), new Vector2(r * 0.5, top + 0.02), new Vector2(0.001, top + 0.0)],
      24,
    );
    parts.push(tube.toNonIndexed());
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const cone = new ConeGeometry(r * 0.32, r * 0.95, 4);
      q.setFromEuler(new Euler(Math.cos(a) * 0.55, 0, -Math.sin(a) * 0.55));
      m.compose(new Vector3(Math.sin(a) * r * 0.66, top + 0.22, Math.cos(a) * r * 0.66), q, new Vector3(1, 1, 0.5));
      cone.applyMatrix4(m);
      parts.push(cone.toNonIndexed());
    }
  } else {
    const ring = new LatheGeometry(
      [new Vector2(0.001, top - 0.06), new Vector2(r * 0.55, top - 0.05), new Vector2(r * 0.95, top + 0.02), new Vector2(r * 1.05, top - 0.02)],
      20,
    );
    parts.push(ring.toNonIndexed());
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const cone = new ConeGeometry(r * 0.3, r * 0.75, 3);
      q.setFromEuler(new Euler(Math.cos(a) * 0.9, 0, -Math.sin(a) * 0.9));
      m.compose(new Vector3(Math.sin(a) * r * 0.85, top + 0.05, Math.cos(a) * r * 0.85), q, new Vector3(1, 1, 0.45));
      cone.applyMatrix4(m);
      parts.push(cone.toNonIndexed());
    }
  }
  return mergeGeometries(parts)!;
}

function beadMatrices(id: string, shape: FruitShape, inner: Vector2[], pit: Vector2[]): Matrix4[] {
  const b = shape.beads!;
  const rand = mulberry32(hashString(id + "beads"));
  const out: Matrix4[] = [];
  const placed: Vector2[] = [];
  const q = new Quaternion();
  const pitCy = shape.pit.y ?? 0;

  const push = (x: number, y: number, sx: number, sy: number, sz: number, rot: number) => {
    q.setFromEuler(new Euler(0, 0, rot));
    out.push(new Matrix4().compose(new Vector3(x, y, sz * 0.25), q, new Vector3(sx, sy, sz)));
  };

  if (b.layout === "pips") {
    const pts: [number, number, number][] = [[0.12, 0.08, -0.4], [-0.12, 0.08, 0.4], [0.11, -0.1, -0.15], [-0.11, -0.1, 0.15]];
    for (const [x, y, r] of pts) push(x, y + pitCy, b.size * 0.62, b.size * 1.25, b.size * 0.5, r);
    return out;
  }

  if (b.layout === "ring") {
    for (let i = 0; i < b.count; i++) {
      const a = (i / b.count) * Math.PI * 2 + rand() * 0.05;
      const row = i % 2 ? 0.86 : 0.95;
      const x = Math.cos(a) * shape.pit.rx * row;
      const y = pitCy + Math.sin(a) * shape.pit.ry * row;
      push(x, y, b.size * 0.75, b.size * 1.5, b.size * 0.7, a + Math.PI / 2);
    }
    return out;
  }

  const minDist = b.size * (b.layout === "arils" ? 1.85 : 1.7);
  let tries = 0;
  while (out.length < b.count && tries < 6000) {
    tries++;
    const bb = b.layout === "arils" ? bounds(inner) : bounds(pit);
    const x = (rand() * 2 - 1) * bb.maxR;
    const y = bb.minY + rand() * (bb.maxY - bb.minY);
    if (b.layout === "arils") {
      if (!insideProfile(insetProfile(inner, 0.93), x, y)) continue;
      if (insideProfile(insetProfile(pit, 1.08, pitCy), x, y)) continue;
    } else if (!insideProfile(insetProfile(pit, 0.86, pitCy), x, y)) continue;
    const p = new Vector2(x, y);
    if (placed.some((o) => o.distanceTo(p) < minDist)) continue;
    placed.push(p);
    const s = b.size * (0.82 + rand() * 0.3);
    push(x, y, s, s * (1.05 + rand() * 0.25), s * 0.7, rand() * Math.PI);
  }
  return out;
}

const cache = new Map<string, FruitGeometry>();

export function getFruitGeometry(id: string): FruitGeometry {
  const hit = cache.get(id);
  if (hit) return hit;
  const shape = SHAPES[id];
  const cy0 = shape.outer.y ?? 0;
  const outer = profile(shape.outer);
  const inner = insetProfile(outer, 1 - shape.peel, cy0);
  const pit = profile(shape.pit, 48);
  const ob = bounds(outer);
  const frame: SectionFrame = { cx: 0, cy: (ob.minY + ob.maxY) / 2, size: Math.max(ob.maxR * 2, ob.maxY - ob.minY) * 1.04 };
  const eq = outer.reduce((a, p) => (p.x > a.x ? p : a), outer[0]);
  const pitB = bounds(pit);
  const pitCy = shape.pit.y ?? 0;
  const z = shape.zScale;

  const lidCut = section(outer, null, frame);
  lidCut.rotateY(Math.PI);

  const top = outer[outer.length - 1].y;
  const g: FruitGeometry = {
    id,
    shape,
    outer,
    inner,
    pit,
    frame,
    bounds: { peel: ob, flesh: bounds(inner), core: pitB },
    eqY: eq.y,
    skinBack: halfLathe(outer, true, z),
    skinFront: halfLathe(outer, false, z),
    peelBowl: halfLathe(inner, true, z),
    fleshOuter: halfLathe(inner, true, z, 0.996),
    fleshCavity: halfLathe(pit, true, z, 1.004),
    pitOuter: halfLathe(pit, true, z),
    peelCut: section(outer, inner, frame),
    fleshCut: section(inner, pit, frame),
    pitCut: section(pit, null, frame),
    lidCut,
    anchors: {
      peel: [eq.x * (1 - shape.peel / 2), eq.y],
      flesh: [(pitB.maxR + radiusAt(inner, pitCy)) / 2, pitCy],
      core: [pitB.maxR * 0.5, pitCy],
    },
  };

  if (shape.extras.stem) {
    const long = id === "apple" || id === "mango";
    g.stem = stemGeometry(top, long ? 0.08 : 0.02, long ? 0.34 : 0.08, long ? 0.035 : 0.06);
  }
  if (shape.extras.leaf) g.leaf = leafGeometry(top);
  if (shape.extras.crown) g.crown = crownGeometry(shape.extras.crown, top, shape.extras.crown === "pomegranate" ? 0.2 : 0.17);
  if (shape.beads) g.beads = { piece: shape.beads.piece, matrices: beadMatrices(id, shape, inner, pit) };

  cache.set(id, g);
  return g;
}

export const BEAD_GEOMETRY = new SphereGeometry(1, 14, 10);
