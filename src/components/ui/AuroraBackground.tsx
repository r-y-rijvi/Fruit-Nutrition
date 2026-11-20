"use client";

import { useEffect, useRef } from "react";
import { FRUIT_BY_ID } from "@/data";
import { useApp } from "@/lib/store";

const VERT = `#version 300 es
in vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

// Domain-warped four-pigment mesh; near a moving cursor the field is sampled on a coarse grid with a ripple, like liquid seen through pixels.
const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uTrail;
uniform vec3 uC[4];
out vec4 o;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; }
  return v;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  float d = length(frag - uMouse);
  float near = smoothstep(220.0, 0.0, d) * uTrail;
  float cell = mix(1.0, 16.0, near);
  vec2 q = cell > 1.5 ? (floor(frag / cell) + 0.5) * cell : frag;
  vec2 uv = q / uRes.y;
  vec2 dir = (frag - uMouse) / max(d, 1.0);
  uv += dir * sin(d * 0.05 - uTime * 5.0) * exp(-d * 0.008) * 0.03 * uTrail;

  float t = uTime * 0.05;
  vec2 w = uv + 0.42 * vec2(fbm(uv * 1.4 + t), fbm(uv * 1.4 - t + 5.2)) - 0.21;
  float aspect = uRes.x / uRes.y;

  vec3 acc = vec3(0.0);
  float wsum = 0.0;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    vec2 c = vec2(aspect * (0.5 + 0.42 * sin(t * 2.1 + fi * 1.9)), 0.5 + 0.4 * cos(t * 1.7 + fi * 2.6));
    float k = exp(-dot(w - c, w - c) / 0.16);
    acc += uC[i] * k;
    wsum += k;
  }
  vec3 col = acc / max(wsum, 1e-3);
  col = mix(col, uC[0], 0.18 * fbm(w * 2.0 + t));
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(lum), col, 1.18);
  col += 0.05 * near;
  col += (hash(frag + fract(uTime)) - 0.5) * 0.025;
  o = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader error");
  return s;
}

export function AuroraBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const gl = canvas.getContext("webgl2", { antialias: false, premultipliedAlpha: false });
    if (!gl || gl.isContextLost()) return;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = u("uRes"), uTime = u("uTime"), uMouse = u("uMouse"), uTrail = u("uTrail"), uC = u("uC");

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scale = 0.6;
    const colors = new Float32Array(12);
    const target = new Float32Array(12);
    const setTarget = (id: string) => FRUIT_BY_ID[id].palette.forEach((h, i) => target.set(hexToRgb(h), i * 3));
    setTarget(useApp.getState().fruitId);
    colors.set(target);
    const unsub = useApp.subscribe((s, p) => {
      if (s.fruitId !== p.fruitId) setTarget(s.fruitId);
    });

    const mouse = { x: -9999, y: -9999, sx: -9999, sy: -9999, trail: 0 };
    const onMove = (e: PointerEvent) => {
      const nx = e.clientX * scale;
      const ny = (window.innerHeight - e.clientY) * scale;
      if (mouse.x > -9000) mouse.trail = Math.min(1, mouse.trail + Math.hypot(nx - mouse.x, ny - mouse.y) * 0.012);
      mouse.x = nx;
      mouse.y = ny;
    };
    if (!still) window.addEventListener("pointermove", onMove, { passive: true });

    const resize = () => {
      canvas.width = Math.round(window.innerWidth * scale);
      canvas.height = Math.round(window.innerHeight * scale);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let last = performance.now();
    let time = 17;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden || !useApp.getState().heroVisible) {
        last = now;
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += still ? dt * 0.15 : dt;
      const k = 1 - Math.exp(-dt * 2.2);
      for (let i = 0; i < 12; i++) colors[i] += (target[i] - colors[i]) * k;
      if (mouse.sx < -9000) {
        mouse.sx = mouse.x;
        mouse.sy = mouse.y;
      }
      mouse.sx += (mouse.x - mouse.sx) * Math.min(1, dt * 10);
      mouse.sy += (mouse.y - mouse.sy) * Math.min(1, dt * 10);
      mouse.trail *= Math.exp(-dt * 1.6);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.uniform2f(uMouse, mouse.sx, mouse.sy);
      gl.uniform1f(uTrail, mouse.trail);
      gl.uniform3fv(uC, colors);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      unsub();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <canvas ref={ref} className="h-full w-full" />
      <div className="grain absolute inset-0" />
    </div>
  );
}
