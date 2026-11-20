import { CanvasTexture, ClampToEdgeWrapping, RepeatWrapping, SRGBColorSpace, type Texture, type Vector2 } from "three";
import { getFruitGeometry, hashString, mulberry32, radiusAt, type FruitGeometry } from "./geometry";
import { insetProfile } from "./shapes";

type Ctx = CanvasRenderingContext2D;
type Rand = () => number;

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext("2d")! };
}

function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function wrap(w: number, x: number, r: number, fn: (x: number) => void) {
  fn(x);
  if (x - r < 0) fn(x + w);
  if (x + r > w) fn(x - w);
}

function dots(ctx: Ctx, rand: Rand, n: number, r0: number, r1: number, color: string, alpha: number, v0 = 0, v1 = 1) {
  const { width: w, height: h } = ctx.canvas;
  ctx.fillStyle = rgba(color, alpha);
  for (let i = 0; i < n; i++) {
    const x = rand() * w;
    const y = (v0 + rand() * (v1 - v0)) * h;
    const r = r0 + rand() * (r1 - r0);
    wrap(w, x, r, (xx) => {
      ctx.beginPath();
      ctx.arc(xx, y, r, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

function blob(ctx: Ctx, x: number, y: number, rx: number, ry: number, color: string, alpha: number) {
  const w = ctx.canvas.width;
  wrap(w, x, rx, (xx) => {
    ctx.save();
    ctx.translate(xx, y);
    ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, rgba(color, alpha));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
    ctx.restore();
  });
}

function vGradient(ctx: Ctx, stops: [number, string][]) {
  const { width: w, height: h } = ctx.canvas;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [t, c] of stops) g.addColorStop(t, c);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function strokes(ctx: Ctx, rand: Rand, n: number, len: number, width: number, colors: string[], alpha: number) {
  const { width: w, height: h } = ctx.canvas;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const x = rand() * w, y = rand() * h, a = rand() * Math.PI * 2, l = len * (0.5 + rand());
    ctx.strokeStyle = rgba(colors[i % colors.length], alpha);
    wrap(w, x, l, (xx) => {
      ctx.beginPath();
      ctx.moveTo(xx, y);
      ctx.lineTo(xx + Math.cos(a) * l, y + Math.sin(a) * l);
      ctx.stroke();
    });
  }
}

function streaks(ctx: Ctx, rand: Rand, n: number, w0: number, w1: number, colors: string[], alpha: number) {
  const { width: w, height: h } = ctx.canvas;
  for (let i = 0; i < n; i++) {
    const x0 = rand() * w, amp = 4 + rand() * 10, f = 1 + rand() * 2, ph = rand() * 6;
    const yA = rand() * 0.15 * h, yB = h * (0.7 + rand() * 0.3);
    ctx.strokeStyle = rgba(colors[i % colors.length], alpha * (0.5 + rand() * 0.5));
    ctx.lineWidth = w0 + rand() * (w1 - w0);
    wrap(w, x0, 20, (xx) => {
      ctx.beginPath();
      for (let y = yA; y <= yB; y += 8) {
        const x = xx + Math.sin((y / h) * Math.PI * f + ph) * amp;
        if (y === yA) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
  }
}

const SKIN_W = 1024;
const SKIN_H = 512;

function paintSkin(id: string, skin: string[], ctx: Ctx, bump: Ctx, rand: Rand) {
  const W = SKIN_W, H = SKIN_H;
  bump.fillStyle = "#808080";
  bump.fillRect(0, 0, W, H);
  switch (id) {
    case "mango": {
      vGradient(ctx, [[0, "#9BD84E"], [0.28, skin[0]], [1, skin[3]]]);
      blob(ctx, W * 0.55, H * 0.4, 300, 220, skin[1], 0.75);
      blob(ctx, W * 0.06, H * 0.32, 320, 210, skin[2], 0.8);
      blob(ctx, W * 0.9, H * 0.18, 220, 140, skin[2], 0.55);
      dots(ctx, rand, 1100, 0.7, 1.7, "#FFF3C4", 0.55);
      dots(bump, rand, 1400, 0.8, 1.8, "#9a9a9a", 0.7);
      break;
    }
    case "orange": {
      ctx.fillStyle = skin[0];
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 24; i++) blob(ctx, rand() * W, rand() * H, 80 + rand() * 120, 60 + rand() * 80, i % 2 ? skin[2] : skin[1], 0.35);
      const pores: [number, number, number][] = [];
      for (let i = 0; i < 10000; i++) pores.push([rand() * W, rand() * H, 0.8 + rand() * 1.4]);
      ctx.fillStyle = rgba("#D9570A", 0.45);
      bump.fillStyle = "rgba(40,40,40,0.55)";
      for (const [x, y, r] of pores) {
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        bump.beginPath(); bump.arc(x, y, r * 1.3, 0, Math.PI * 2); bump.fill();
      }
      ctx.fillStyle = rgba("#6F7F22", 0.9);
      ctx.fillRect(0, 0, W, H * 0.018);
      break;
    }
    case "avocado": {
      vGradient(ctx, [[0, skin[1]], [0.35, skin[0]], [1, skin[2]]]);
      const pebbles: [number, number, number][] = [];
      for (let i = 0; i < 3200; i++) pebbles.push([rand() * W, rand() * H, 1.8 + rand() * 4.5]);
      pebbles.forEach(([x, y, r], i) => {
        ctx.fillStyle = rgba(i % 3 ? skin[1] : "#5E6B2A", 0.45);
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        bump.fillStyle = "rgba(230,230,230,0.5)";
        bump.beginPath(); bump.arc(x, y, r, 0, Math.PI * 2); bump.fill();
      });
      dots(ctx, rand, 400, 0.8, 1.4, "#A9B55A", 0.4);
      break;
    }
    case "kiwi": {
      vGradient(ctx, [[0, skin[1]], [0.12, skin[0]], [0.9, skin[0]], [1, skin[1]]]);
      for (let i = 0; i < 30; i++) blob(ctx, rand() * W, rand() * H, 60 + rand() * 90, 40 + rand() * 60, i % 2 ? skin[2] : skin[1], 0.3);
      strokes(ctx, rand, 16000, 3.5, 1, [skin[1], skin[2], "#C49A6C"], 0.38);
      strokes(bump, rand, 9000, 3, 1, ["#b0b0b0", "#505050"], 0.5);
      break;
    }
    case "pomegranate": {
      vGradient(ctx, [[0, skin[2]], [0.3, skin[0]], [0.85, skin[0]], [1, "#A5101C"]]);
      for (let i = 0; i < 16; i++) blob(ctx, rand() * W, H * (0.2 + rand() * 0.7), 90 + rand() * 120, 60 + rand() * 80, skin[1], 0.45);
      for (let i = 0; i < 6; i++) blob(ctx, rand() * W, H * (0.3 + rand() * 0.6), 70 + rand() * 90, 50 + rand() * 60, skin[3], 0.3);
      dots(ctx, rand, 700, 0.5, 1.3, "#F7C59F", 0.32);
      for (let i = 0; i < 40; i++) blob(bump, rand() * W, rand() * H, 40 + rand() * 60, 30 + rand() * 40, "#a0a0a0", 0.5);
      break;
    }
    case "blueberry": {
      vGradient(ctx, [[0, skin[1]], [0.25, skin[0]], [1, skin[1]]]);
      for (let i = 0; i < 46; i++) blob(ctx, rand() * W, rand() * H, 40 + rand() * 110, 30 + rand() * 80, skin[2], 0.32);
      dots(ctx, rand, 3200, 0.6, 1.6, "#C9D3F0", 0.16);
      ctx.fillStyle = rgba("#141B45", 0.85);
      ctx.fillRect(0, 0, W, H * 0.03);
      break;
    }
    case "apple": {
      vGradient(ctx, [[0, "#8E1B1B"], [0.12, skin[0]], [0.8, skin[0]], [1, "#B52424"]]);
      blob(ctx, W * 0.5, H * 0.72, 300, 200, skin[3], 0.55);
      blob(ctx, W * 0.45, H * 0.58, 320, 220, skin[1], 0.35);
      streaks(ctx, rand, 280, 1, 4, [skin[1], skin[2], "#E8473C"], 0.38);
      dots(ctx, rand, 800, 0.8, 1.8, "#FBE3B0", 0.6);
      dots(bump, rand, 600, 0.8, 1.6, "#9a9a9a", 0.6);
      ctx.fillStyle = rgba("#6F7F22", 0.55);
      ctx.fillRect(0, 0, W, H * 0.05);
      break;
    }
    case "papaya": {
      vGradient(ctx, [[0, skin[2]], [0.3, skin[0]], [0.62, skin[1]], [1, "#FF9F1C"]]);
      streaks(ctx, rand, 60, 4, 10, [skin[2], skin[0]], 0.32);
      for (let i = 0; i < 14; i++) blob(ctx, rand() * W, H * (0.4 + rand() * 0.5), 80 + rand() * 120, 50 + rand() * 80, "#FF8C42", 0.35);
      dots(ctx, rand, 900, 0.6, 1.5, "#FFE7A3", 0.4);
      for (let i = 0; i < 30; i++) blob(bump, rand() * W, rand() * H, 50, 120, "#9a9a9a", 0.4);
      break;
    }
  }
}

const SEC = 1024;

function sectionPainter(geo: FruitGeometry, ctx: Ctx) {
  const { frame } = geo;
  const px = (x: number, y: number): [number, number] => [((x - frame.cx) / frame.size + 0.5) * SEC, (0.5 - (y - frame.cy) / frame.size) * SEC];
  const scale = SEC / frame.size;
  const path = (pts: Vector2[]) => {
    ctx.beginPath();
    pts.forEach((p, i) => {
      const [x, y] = px(p.x, p.y);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    for (let i = pts.length - 2; i >= 1; i--) {
      const [x, y] = px(-pts[i].x, pts[i].y);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
  };
  const fill = (pts: Vector2[], style: string | CanvasGradient) => {
    path(pts);
    ctx.fillStyle = style;
    ctx.fill();
  };
  const radial = (x: number, y: number, r: number, stops: [number, string][]) => {
    const [cx, cy] = px(x, y);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * scale);
    for (const [t, c] of stops) g.addColorStop(t, c);
    return g;
  };
  const clip = (pts: Vector2[], fn: () => void) => {
    ctx.save();
    path(pts);
    ctx.clip();
    fn();
    ctx.restore();
  };
  return { px, scale, path, fill, radial, clip };
}

function paintSection(geo: FruitGeometry, ctx: Ctx, rand: Rand) {
  const { shape, outer, inner, pit, id } = geo;
  const P = sectionPainter(geo, ctx);
  const cy0 = shape.outer.y ?? 0;
  const pitCy = shape.pit.y ?? 0;
  const R = geo.bounds.peel.maxR;
  const rim = insetProfile(outer, 1 - shape.peel * 0.32, cy0);

  P.fill(outer, shape.skin[0]);
  P.fill(rim, shape.peelInner);

  const dotsIn = (pts: Vector2[], n: number, r0: number, r1: number, color: string, alpha: number) => {
    P.clip(pts, () => {
      const b = geo.bounds.peel;
      ctx.fillStyle = rgba(color, alpha);
      for (let i = 0; i < n; i++) {
        const [x, y] = P.px((rand() * 2 - 1) * b.maxR, b.minY + rand() * (b.maxY - b.minY));
        ctx.beginPath();
        ctx.arc(x, y, r0 + rand() * (r1 - r0), 0, Math.PI * 2);
        ctx.fill();
      }
    });
  };

  const rays = (count: number, from: number, to: number, color: string, alpha: number, width: number) => {
    P.clip(inner, () => {
      ctx.strokeStyle = rgba(color, alpha);
      ctx.lineWidth = width;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + rand() * 0.04;
        const [x0, y0] = P.px(Math.cos(a) * shape.pit.rx * from, pitCy + Math.sin(a) * shape.pit.ry * from);
        const [x1, y1] = P.px(Math.cos(a) * R * to, pitCy + Math.sin(a) * R * to);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
    });
  };

  switch (id) {
    case "mango": {
      P.fill(inner, P.radial(0, pitCy, R * 1.05, [[0, shape.flesh[1]], [0.55, shape.flesh[1]], [1, shape.flesh[0]]]));
      rays(160, 1.0, 0.9, "#FFD27A", 0.2, 1.4);
      P.fill(pit, P.radial(0, pitCy, shape.pit.ry, [[0, "#F3E8CC"], [1, shape.pitColors[0]]]));
      P.clip(pit, () => {
        ctx.strokeStyle = rgba(shape.pitColors[1], 0.55);
        ctx.lineWidth = 1.6;
        for (let i = 0; i < 70; i++) {
          const x = (rand() * 2 - 1) * shape.pit.rx;
          const [ax, ay] = P.px(x, pitCy - shape.pit.ry);
          const [bx, by] = P.px(x * 0.6 + (rand() - 0.5) * 0.05, pitCy + shape.pit.ry);
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.quadraticCurveTo(ax + (rand() - 0.5) * 30, (ay + by) / 2, bx, by);
          ctx.stroke();
        }
      });
      P.fill(insetProfile(pit, 0.58, pitCy), P.radial(0, pitCy, shape.pit.ry * 0.6, [[0, "#E7D3A4"], [1, "#CDB27A"]]));
      break;
    }
    case "orange": {
      P.fill(inner, P.radial(0, 0, R, [[0, shape.flesh[1]], [1, shape.flesh[0]]]));
      P.clip(inner, () => {
        for (let i = 0; i < 1800; i++) {
          const y = geo.bounds.flesh.minY + rand() * (geo.bounds.flesh.maxY - geo.bounds.flesh.minY);
          const rr = radiusAt(inner, y);
          const x = (rand() * 2 - 1) * rr;
          const [cx, cy] = P.px(x, y);
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate((x / Math.max(rr, 0.01)) * (y / R) * 0.9);
          ctx.fillStyle = rgba(i % 3 ? "#FFC266" : "#F57F12", 0.45);
          ctx.beginPath();
          ctx.ellipse(0, 0, 3.2, 10, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.strokeStyle = rgba("#FFF4DE", 0.9);
        ctx.lineWidth = 3.2;
        for (let j = -4; j <= 4; j++) {
          ctx.beginPath();
          const b = geo.bounds.flesh;
          for (let s = 0; s <= 60; s++) {
            const y = b.minY + ((b.maxY - b.minY) * s) / 60;
            const [x, yy] = P.px((j / 4.7) * radiusAt(inner, y), y);
            if (s) ctx.lineTo(x, yy);
            else ctx.moveTo(x, yy);
          }
          ctx.stroke();
        }
      });
      P.fill(pit, P.radial(0, 0, shape.pit.ry, [[0, "#FFFAEE"], [1, shape.pitColors[0]]]));
      for (const [x, y] of [[0.07, 0.22], [-0.08, -0.18]]) {
        const [cx, cy] = P.px(x, y);
        ctx.fillStyle = shape.pitColors[1];
        ctx.strokeStyle = "#E3C48E";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 0.07 * P.scale, 0.13 * P.scale, x > 0 ? -0.3 : 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      break;
    }
    case "avocado": {
      P.fill(inner, P.radial(0, pitCy, R * 1.25, [[0, "#F2F5A8"], [0.38, "#EAF29A"], [0.72, shape.flesh[0]], [0.9, "#9DBE3E"], [1, shape.peelInner]]));
      dotsIn(inner, 500, 0.8, 1.6, "#FFFFFF", 0.1);
      P.fill(pit, P.radial(-0.1, pitCy + 0.12, shape.pit.rx * 1.2, [[0, shape.pitColors[1]], [0.7, shape.pitColors[0]], [1, "#6B4024"]]));
      dotsIn(pit, 260, 0.8, 2, "#5C3A20", 0.35);
      break;
    }
    case "kiwi": {
      P.fill(rim, shape.skin[1]);
      P.fill(insetProfile(outer, 1 - shape.peel * 0.7, cy0), shape.peelInner);
      P.fill(inner, P.radial(0, 0, R, [[0, shape.flesh[1]], [0.55, shape.flesh[0]], [1, "#55A836"]]));
      rays(180, 1.0, 1.1, "#D4F0A6", 0.32, 1.6);
      P.fill(pit, P.radial(0, 0, shape.pit.ry, [[0, "#B6DA72"], [1, "#9CCB5A"]]));
      P.fill(insetProfile(pit, 0.8), P.radial(0, 0, shape.pit.ry * 0.8, [[0, "#FFFDF0"], [1, shape.pitColors[0]]]));
      P.clip(pit, () => {
        ctx.fillStyle = "#1A140C";
        for (let i = 0; i < 140; i++) {
          const a = rand() * Math.PI * 2;
          const k = 0.82 + rand() * 0.16;
          const [cx, cy] = P.px(Math.cos(a) * shape.pit.rx * k, Math.sin(a) * shape.pit.ry * k);
          ctx.beginPath();
          ctx.ellipse(cx, cy, 2.2, 4.4, a + Math.PI / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      break;
    }
    case "pomegranate": {
      P.fill(rim, P.radial(0, 0, R, [[0.7, "#FBEFD8"], [1, shape.peelInner]]));
      P.fill(inner, "#F1DDB8");
      P.clip(inner, () => {
        const b = geo.bounds.flesh;
        for (let i = 0; i < 520; i++) {
          const [cx, cy] = P.px((rand() * 2 - 1) * b.maxR, b.minY + rand() * (b.maxY - b.minY));
          const r = 11 + rand() * 9;
          const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 1, cx, cy, r);
          g.addColorStop(0, "#FF6B81");
          g.addColorStop(0.45, shape.flesh[1]);
          g.addColorStop(1, shape.flesh[0]);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.ellipse(cx, cy, r, r * 1.15, rand() * Math.PI, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = rgba("#F6E7C8", 0.95);
        ctx.lineWidth = 7;
        for (const [a, bend] of [[0.3, 0.25], [1.9, -0.2], [3.5, 0.2], [4.9, -0.25]]) {
          const [x0, y0] = P.px(0, 0);
          const [x1, y1] = P.px(Math.cos(a) * R, Math.sin(a) * R);
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.quadraticCurveTo((x0 + x1) / 2 + bend * 160, (y0 + y1) / 2 - bend * 120, x1, y1);
          ctx.stroke();
        }
      });
      P.fill(pit, P.radial(0, 0, shape.pit.ry, [[0, "#FFF6E2"], [1, shape.pitColors[1]]]));
      dotsIn(pit, 220, 1, 2.6, "#D9BF8F", 0.55);
      break;
    }
    case "blueberry": {
      P.fill(inner, P.radial(0, 0, R, [[0, "#E3EBC0"], [0.5, shape.flesh[0]], [0.8, "#A88BC0"], [1, "#6B3E92"]]));
      dotsIn(inner, 600, 0.8, 2, "#FFFFFF", 0.12);
      P.fill(pit, P.radial(0, 0, shape.pit.rx, [[0, "#F2EDD0"], [1, shape.pitColors[0]]]));
      P.clip(pit, () => {
        const [cx, cy] = P.px(0, 0);
        ctx.strokeStyle = rgba("#CFC28E", 0.9);
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(a) * shape.pit.rx * P.scale, cy + Math.sin(a) * shape.pit.ry * P.scale);
          ctx.stroke();
        }
      });
      dotsIn(pit, 40, 2, 3.4, shape.pitColors[1], 0.95);
      break;
    }
    case "apple": {
      P.fill(inner, P.radial(0, pitCy, R, [[0, shape.flesh[1]], [0.6, shape.flesh[0]], [1, "#FFF8E6"]]));
      dotsIn(inner, 700, 0.8, 1.6, "#E8D59C", 0.25);
      P.clip(inner, () => {
        const [cx, cy] = P.px(0, pitCy);
        ctx.strokeStyle = rgba("#E6CF8C", 0.7);
        ctx.lineWidth = 2.4;
        ctx.setLineDash([2, 10]);
        ctx.beginPath();
        ctx.ellipse(cx, cy, shape.pit.rx * 1.7 * P.scale, shape.pit.ry * 1.45 * P.scale, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = rgba("#D9C78E", 0.8);
        ctx.lineWidth = 3;
        const [tx, ty] = P.px(0, geo.bounds.flesh.maxY);
        const [bx, by] = P.px(0, geo.bounds.flesh.minY);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(cx, cy - shape.pit.ry * P.scale);
        ctx.moveTo(cx, cy + shape.pit.ry * P.scale);
        ctx.lineTo(bx, by);
        ctx.stroke();
      });
      P.fill(pit, P.radial(0, pitCy, shape.pit.ry, [[0, "#F6EDCB"], [1, shape.pitColors[0]]]));
      for (const side of [-1, 1]) {
        const [cx, cy] = P.px(side * 0.12, pitCy);
        ctx.fillStyle = shape.pitColors[1];
        ctx.strokeStyle = rgba("#C2AE72", 0.9);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 0.09 * P.scale, 0.26 * P.scale, side * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      break;
    }
    case "papaya": {
      P.fill(inner, P.radial(0, pitCy, R * 1.1, [[0, shape.flesh[1]], [0.5, shape.flesh[1]], [1, shape.flesh[0]]]));
      dotsIn(inner, 500, 0.8, 1.8, "#FFD0B0", 0.18);
      P.fill(insetProfile(pit, 1.04, pitCy), "#FFC09A");
      P.fill(pit, P.radial(0, pitCy, shape.pit.ry, [[0, "#4A3626"], [1, shape.pitColors[1]]]));
      P.clip(pit, () => {
        for (let i = 0; i < 160; i++) {
          const [cx, cy] = P.px((rand() * 2 - 1) * shape.pit.rx, pitCy + (rand() * 2 - 1) * shape.pit.ry);
          const g = ctx.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, 13);
          g.addColorStop(0, "#5A4A3E");
          g.addColorStop(1, "#120D09");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(cx, cy, 11 + rand() * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      break;
    }
  }

  ctx.lineWidth = 3;
  ctx.strokeStyle = rgba(shape.skin[shape.skin.length > 2 ? 2 : 1], 0.65);
  P.path(outer);
  ctx.stroke();
}

function paintSurface(geo: FruitGeometry, kind: "flesh" | "pit", ctx: Ctx, rand: Rand) {
  const s = geo.shape;
  const { width: W, height: H } = ctx.canvas;
  const [a, b] = kind === "flesh" ? s.flesh : s.pitColors;
  vGradient(ctx, [[0, b], [0.5, a], [1, b]]);
  for (let i = 0; i < 30; i++) blob(ctx, rand() * W, rand() * H, 30 + rand() * 60, 20 + rand() * 40, i % 2 ? a : b, 0.35);
  if (kind === "flesh" && geo.id === "orange") {
    ctx.strokeStyle = rgba("#FFF4DE", 0.8);
    ctx.lineWidth = 3;
    for (let i = 0; i < 10; i++) {
      const x = (i / 10) * W;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + 10, H * 0.3, x - 10, H * 0.7, x, H);
      ctx.stroke();
    }
  }
  if (kind === "flesh" && geo.id === "pomegranate") dots(ctx, rand, 900, 5, 9, "#E63950", 0.85);
  if (kind === "pit" && geo.id === "papaya") dots(ctx, rand, 900, 5, 8, "#0E0A07", 0.9);
  if (kind === "pit" && geo.id === "mango") streaks(ctx, rand, 140, 1, 2.5, ["#B9A272", "#F3E8CC"], 0.5);
  dots(ctx, rand, 900, 0.6, 1.6, "#FFFFFF", 0.1);
}

export interface FruitTextures {
  skin: Texture;
  skinBump: Texture;
  section: Texture;
  fleshSurface: Texture;
  pitSurface: Texture;
}

const cache = new Map<string, FruitTextures>();
let noiseBump: Texture | null = null;

function finish(c: HTMLCanvasElement, color: boolean, repeat: boolean): Texture {
  const t = new CanvasTexture(c);
  if (color) t.colorSpace = SRGBColorSpace;
  t.wrapS = repeat ? RepeatWrapping : ClampToEdgeWrapping;
  t.wrapT = ClampToEdgeWrapping;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

export function getNoiseBump(): Texture {
  if (noiseBump) return noiseBump;
  const { c, ctx } = canvas(512, 256);
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, 512, 256);
  const rand = mulberry32(7);
  dots(ctx, rand, 2600, 0.8, 2.4, "#9c9c9c", 0.6);
  dots(ctx, rand, 1600, 0.8, 2.4, "#646464", 0.6);
  noiseBump = finish(c, false, true);
  return noiseBump;
}

export function getFruitTextures(id: string): FruitTextures {
  const hit = cache.get(id);
  if (hit) return hit;
  const geo = getFruitGeometry(id);
  const rand = mulberry32(hashString(id));

  const skin = canvas(SKIN_W, SKIN_H);
  const bump = canvas(SKIN_W, SKIN_H);
  paintSkin(id, geo.shape.skin, skin.ctx, bump.ctx, rand);

  const sec = canvas(SEC, SEC);
  paintSection(geo, sec.ctx, rand);

  const flesh = canvas(512, 256);
  paintSurface(geo, "flesh", flesh.ctx, rand);
  const pit = canvas(512, 256);
  paintSurface(geo, "pit", pit.ctx, rand);

  const tex: FruitTextures = {
    skin: finish(skin.c, true, true),
    skinBump: finish(bump.c, false, true),
    section: finish(sec.c, true, false),
    fleshSurface: finish(flesh.c, true, true),
    pitSurface: finish(pit.c, true, true),
  };
  cache.set(id, tex);
  return tex;
}
