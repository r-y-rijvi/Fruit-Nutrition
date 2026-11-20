"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import {
  Color,
  DirectionalLight,
  HemisphereLight,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  WebGLRenderTarget,
} from "three";
import { FRUITS } from "@/data";
import { useApp } from "@/lib/store";
import { buildFruit } from "./fruitObject";

const SIZE = 256;

/** Renders each procedural fruit once into an offscreen target so the dock shows real 3D thumbnails. */
export function ThumbnailBaker() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const setThumb = useApp((s) => s.setThumb);

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    const rt = new WebGLRenderTarget(SIZE, SIZE, { samples: 4 });
    rt.texture.colorSpace = SRGBColorSpace;
    const bake = new Scene();
    const camera = new PerspectiveCamera(30, 1, 0.1, 50);
    const key = new DirectionalLight("#FFE6CC", 1.7);
    key.position.set(3, 4, 5);
    const rim = new DirectionalLight("#ffffff", 1.6);
    rim.position.set(-3, 2, -4);
    bake.add(new HemisphereLight("#FFF4E6", "#2A1830", 0.5), key, rim);
    const pixels = new Uint8Array(SIZE * SIZE * 4);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = SIZE;
    const ctx = canvas.getContext("2d")!;
    const prevClear = new Color();
    let i = 0;

    const step = () => {
      if (cancelled || i >= FRUITS.length) return;
      if (!scene.environment) {
        raf = requestAnimationFrame(step);
        return;
      }
      bake.environment = scene.environment;
      const id = FRUITS[i++].id;
      const rig = buildFruit(id);
      const b = rig.geo.bounds.peel;
      rig.root.position.y = -(b.minY + b.maxY) / 2 - 0.04;
      rig.spinner.rotation.set(0.12, 0.7, 0);
      const extent = Math.max(b.maxY - b.minY + 0.35, b.maxR * 2);
      camera.position.set(0, 0.25, (extent * 0.6) / Math.tan((15 * Math.PI) / 180));
      camera.lookAt(0, 0, 0);
      bake.add(rig.root);

      const prevTarget = gl.getRenderTarget();
      gl.getClearColor(prevClear);
      const prevAlpha = gl.getClearAlpha();
      gl.setRenderTarget(rt);
      gl.setClearColor(0x000000, 0);
      gl.clear();
      gl.render(bake, camera);
      gl.readRenderTargetPixels(rt, 0, 0, SIZE, SIZE, pixels);
      gl.setRenderTarget(prevTarget);
      gl.setClearColor(prevClear, prevAlpha);

      const img = ctx.createImageData(SIZE, SIZE);
      const row = SIZE * 4;
      for (let y = 0; y < SIZE; y++) img.data.set(pixels.subarray((SIZE - 1 - y) * row, (SIZE - y) * row), y * row);
      const px = img.data;
      for (let k = 0; k < px.length; k += 4) {
        const a = px[k + 3];
        if (a > 0 && a < 255) {
          px[k] = Math.min(255, (px[k] * 255) / a);
          px[k + 1] = Math.min(255, (px[k + 1] * 255) / a);
          px[k + 2] = Math.min(255, (px[k + 2] * 255) / a);
        }
      }
      ctx.putImageData(img, 0, 0);
      setThumb(id, canvas.toDataURL("image/png"));
      bake.remove(rig.root);
      rig.dispose();
      raf = requestAnimationFrame(step);
    };

    const start = window.setTimeout(() => (raf = requestAnimationFrame(step)), 500);
    return () => {
      cancelled = true;
      window.clearTimeout(start);
      cancelAnimationFrame(raf);
      rt.dispose();
    };
  }, [gl, scene, setThumb]);

  return null;
}
