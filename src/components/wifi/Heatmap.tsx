import { useMemo } from "react";
import * as THREE from "three";
import { bestSignal, signalColor, type AccessPoint, type FloorPlan } from "@/lib/floorplan";

const RES = 128;

export function Heatmap({
  plan,
  aps,
  band,
  opacity,
  height,
}: {
  plan: FloorPlan;
  aps: AccessPoint[];
  band: number;
  opacity: number;
  height: number;
}) {
  const texture = useMemo(() => {
    const cw = RES;
    const ch = Math.max(8, Math.round((RES * plan.depth) / plan.width));
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d")!;
    const img = ctx.createImageData(cw, ch);
    for (let j = 0; j < ch; j++) {
      for (let i = 0; i < cw; i++) {
        const x = ((i + 0.5) / cw) * plan.width;
        const z = ((j + 0.5) / ch) * plan.depth;
        const { dbm } = bestSignal(plan, aps, x, z, band);
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
  }, [plan, aps, band]);

  if (opacity <= 0) return null;

  return (
    <mesh
      position={[plan.width / 2, height, plan.depth / 2]}
      rotation-x={-Math.PI / 2}
      renderOrder={2}
    >
      <planeGeometry args={[plan.width, plan.depth]} />
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
