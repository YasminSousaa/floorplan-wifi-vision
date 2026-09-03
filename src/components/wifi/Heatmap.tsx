import { useMemo } from "react";
import * as THREE from "three";
import {
  PLAN_D,
  PLAN_W,
  bestSignal,
  signalColor,
  type AccessPoint,
} from "@/lib/floorplan";

const RES = 128;

export function Heatmap({
  aps,
  band,
  opacity,
  height,
}: {
  aps: AccessPoint[];
  band: number;
  opacity: number;
  height: number;
}) {
  const texture = useMemo(() => {
    const cw = RES;
    const ch = Math.round((RES * PLAN_D) / PLAN_W);
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d")!;
    const img = ctx.createImageData(cw, ch);
    for (let j = 0; j < ch; j++) {
      for (let i = 0; i < cw; i++) {
        const x = ((i + 0.5) / cw) * PLAN_W;
        const z = ((j + 0.5) / ch) * PLAN_D;
        const { dbm } = bestSignal(aps, x, z, band);
        const [r, g, b] = signalColor(dbm);
        const o = (j * cw + i) * 4;
        img.data[o] = r;
        img.data[o + 1] = g;
        img.data[o + 2] = b;
        img.data[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, [aps, band]);

  if (opacity <= 0) return null;

  return (
    <mesh
      position={[PLAN_W / 2, height, PLAN_D / 2]}
      rotation-x={-Math.PI / 2}
      renderOrder={2}
    >
      <planeGeometry args={[PLAN_W, PLAN_D]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
