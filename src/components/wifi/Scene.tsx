import {
  Environment,
  Html,
  Instance,
  Instances,
  Lightformer,
  OrbitControls,
  Text,
} from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import {
  bestSignal,
  estimateSpeed,
  quality,
  type AccessPoint,
  type FloorPlan,
  type Surface,
} from "@/lib/floorplan";
import { Heatmap } from "./Heatmap";

const SURFACE_STYLE: Record<
  Surface["kind"],
  { color: string; rough: number; metal: number; y: number }
> = {
  grama: { color: "#4d7a45", rough: 1, metal: 0, y: 0.02 },
  areia: { color: "#e3d3a6", rough: 1, metal: 0, y: 0.04 },
  mar: { color: "#2f93bb", rough: 0.15, metal: 0.35, y: 0.03 },
  asfalto: { color: "#63676f", rough: 0.95, metal: 0, y: 0.06 },
  calcada: { color: "#cdc4ae", rough: 0.95, metal: 0, y: 0.07 },
  deck: { color: "#a9764a", rough: 0.8, metal: 0, y: 0.09 },
  "quadra-azul": { color: "#3d7cc4", rough: 0.9, metal: 0, y: 0.1 },
  "quadra-verde": { color: "#3f8f5a", rough: 0.9, metal: 0, y: 0.1 },
  agua: { color: "#3fb9dd", rough: 0.08, metal: 0.4, y: 0.14 },
  telhado: { color: "#d9c7a8", rough: 0.9, metal: 0, y: 0.12 },
};

function roundedGeometry(w: number, d: number, r: number) {
  const rad = Math.min(r, w / 2, d / 2);
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + rad, -d / 2);
  s.lineTo(w / 2 - rad, -d / 2);
  s.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + rad);
  s.lineTo(w / 2, d / 2 - rad);
  s.quadraticCurveTo(w / 2, d / 2, w / 2 - rad, d / 2);
  s.lineTo(-w / 2 + rad, d / 2);
  s.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - rad);
  s.lineTo(-w / 2, -d / 2 + rad);
  s.quadraticCurveTo(-w / 2, -d / 2, -w / 2, -d / 2 + rad);
  return new THREE.ShapeGeometry(s, 16);
}

function Surfaces({ plan }: { plan: FloorPlan }) {
  const items = plan.surfaces ?? [];
  return (
    <group>
      {items.map((s, i) => {
        const st = SURFACE_STYLE[s.kind];
        return (
          <mesh
            key={i}
            receiveShadow
            rotation-x={-Math.PI / 2}
            position={[s.x + s.w / 2, st.y + i * 0.004, s.z + s.d / 2]}
            geometry={roundedGeometry(s.w, s.d, s.r ?? 0.001)}
          >
            <meshStandardMaterial color={st.color} roughness={st.rough} metalness={st.metal} />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * Geometria de um telhado de duas águas (prisma triangular): cumeeira ao
 * longo do eixo X local, alinhada com o lado mais comprido do prédio.
 * Sombreamento plano por face (não-indexado + computeVertexNormals) para
 * ler como facetas de telhado, não como uma superfície curva.
 */
function gableRoofGeometry(ridgeLength: number, baseWidth: number, ridgeHeight: number) {
  const hw = ridgeLength / 2;
  const hd = baseWidth / 2;
  const A = [-hw, 0, -hd];
  const B = [-hw, 0, hd];
  const C = [-hw, ridgeHeight, 0];
  const D = [hw, 0, -hd];
  const E = [hw, 0, hd];
  const F = [hw, ridgeHeight, 0];
  const tris = [A, B, C, D, F, E, A, C, F, A, F, D, B, E, F, B, F, C];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(tris.flat()), 3));
  geo.computeVertexNormals();
  return geo;
}

function GuestRoof({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  const long = Math.max(w, d);
  const short = Math.min(w, d);
  const ridgeHeight = Math.min(h * 0.32, short * 0.42);
  const geo = useMemo(
    () => gableRoofGeometry(long + 1, short + 1, ridgeHeight),
    [long, short, ridgeHeight],
  );
  return (
    <mesh castShadow geometry={geo} position-y={h} rotation-y={d > w ? Math.PI / 2 : 0}>
      <meshStandardMaterial color={color} roughness={0.72} />
    </mesh>
  );
}

function PalapaRoof({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  const radius = Math.max(w, d) * 0.6;
  const coneHeight = radius * 0.62;
  return (
    <mesh castShadow position-y={h + coneHeight / 2} rotation-y={Math.PI / 8}>
      <coneGeometry args={[radius, coneHeight, 8]} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  );
}

function FlatParapetRoof({
  w,
  d,
  h,
  color,
  trim,
}: {
  w: number;
  d: number;
  h: number;
  color: string;
  trim: string;
}) {
  const ow = w + 1.2;
  const od = d + 1.2;
  const t = 0.35;
  return (
    <group position-y={h}>
      <mesh castShadow position-y={0.45}>
        <boxGeometry args={[ow, 0.9, od]} />
        <meshStandardMaterial color={color} roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.95, -od / 2 + t / 2]}>
        <boxGeometry args={[ow, 0.5, t]} />
        <meshStandardMaterial color={trim} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.95, od / 2 - t / 2]}>
        <boxGeometry args={[ow, 0.5, t]} />
        <meshStandardMaterial color={trim} roughness={0.6} />
      </mesh>
      <mesh position={[-ow / 2 + t / 2, 0.95, 0]}>
        <boxGeometry args={[t, 0.5, od]} />
        <meshStandardMaterial color={trim} roughness={0.6} />
      </mesh>
      <mesh position={[ow / 2 - t / 2, 0.95, 0]}>
        <boxGeometry args={[t, 0.5, od]} />
        <meshStandardMaterial color={trim} roughness={0.6} />
      </mesh>
    </group>
  );
}

const BUILDING_STYLE = {
  guest: { wall: "#efe6d3", roof: "#c1633b" },
  lobby: { wall: "#f2efe6", roof: "#ece7d8", trim: "#c9b995" },
  event: { wall: "#edeee9", roof: "#f4f3ee", trim: "#a9afae" },
  dining: { wall: "#e8d9c2", roof: "#8b6239" },
} as const;

function Buildings({ plan }: { plan: FloorPlan }) {
  const items = plan.buildings ?? [];
  return (
    <group>
      {items.map((b, i) => {
        const style = b.kind ? BUILDING_STYLE[b.kind] : null;
        return (
          <group key={i} position={[b.x + b.w / 2, 0, b.z + b.d / 2]}>
            <mesh castShadow receiveShadow position={[0, b.h / 2, 0]}>
              <boxGeometry args={[b.w, b.h, b.d]} />
              <meshStandardMaterial color={style?.wall ?? "#e7ded0"} roughness={0.85} />
            </mesh>

            {b.kind === "guest" && <GuestRoof w={b.w} d={b.d} h={b.h} color={style!.roof} />}
            {b.kind === "dining" && <PalapaRoof w={b.w} d={b.d} h={b.h} color={style!.roof} />}
            {(b.kind === "lobby" || b.kind === "event") && (
              <FlatParapetRoof
                w={b.w}
                d={b.d}
                h={b.h}
                color={style!.roof}
                trim={b.kind === "lobby" ? BUILDING_STYLE.lobby.trim : BUILDING_STYLE.event.trim}
              />
            )}
            {!b.kind && (
              <mesh castShadow position={[0, b.h + 0.5, 0]}>
                <boxGeometry args={[b.w + 1.2, 1, b.d + 1.2]} />
                <meshStandardMaterial color={b.roof ?? "#d8c8ab"} roughness={0.9} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

function Trees({ plan }: { plan: FloorPlan }) {
  const trees = plan.trees ?? [];
  const palms = trees.filter((t) => t.kind === "palmeira");
  const tops = trees.filter((t) => t.kind === "copa");
  if (!trees.length) return null;
  return (
    <group>
      <Instances limit={trees.length} castShadow>
        <cylinderGeometry args={[0.22, 0.38, 6, 6]} />
        <meshStandardMaterial color="#7d5a3a" roughness={1} />
        {trees.map((t, i) => (
          <Instance key={i} position={[t.x, 3 * t.s, t.z]} scale={[t.s, t.s, t.s]} />
        ))}
      </Instances>

      <Instances limit={Math.max(1, palms.length)} castShadow>
        <sphereGeometry args={[2.6, 8, 6]} />
        <meshStandardMaterial color="#3f7d3f" roughness={0.95} />
        {palms.map((t, i) => (
          <Instance
            key={i}
            position={[t.x, 6.4 * t.s, t.z]}
            scale={[t.s * 1.25, t.s * 0.55, t.s * 1.25]}
          />
        ))}
      </Instances>

      <Instances limit={Math.max(1, tops.length)} castShadow>
        <coneGeometry args={[3, 6, 7]} />
        <meshStandardMaterial color="#356b39" roughness={0.95} />
        {tops.map((t, i) => (
          <Instance key={i} position={[t.x, 8 * t.s, t.z]} scale={[t.s, t.s, t.s]} />
        ))}
      </Instances>
    </group>
  );
}

/* ── Pool with depth illusion, waterline tiles, and entry steps ─────── */

function Pool({ x, z, w, d, radius }: { x: number; z: number; w: number; d: number; radius: number }) {
  const copingR = radius + 0.8;
  const water = useMemo(() => roundedGeometry(w, d, radius), [w, d, radius]);
  const coping = useMemo(
    () => roundedGeometry(w + 1.6, d + 1.6, copingR),
    [w, d, copingR],
  );
  // Pool floor — slightly smaller, sunk below the water surface
  const floor = useMemo(
    () => roundedGeometry(Math.max(0.5, w - 0.4), Math.max(0.5, d - 0.4), Math.max(0, radius - 0.3)),
    [w, d, radius],
  );
  // Waterline tile border (thin ring between coping and water)
  const tileBorder = useMemo(
    () => roundedGeometry(w + 0.3, d + 0.3, radius + 0.15),
    [w, d, radius],
  );
  const stepDepth = Math.min(0.8, d * 0.12);
  const stepW = Math.min(3, w * 0.15);
  return (
    <group position={[x + w / 2, 0, z + d / 2]}>
      {/* Coping (deck edge) */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.13} receiveShadow geometry={coping}>
        <meshStandardMaterial color="#e9e3d7" roughness={0.78} />
      </mesh>
      {/* Waterline tile border */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.16} geometry={tileBorder}>
        <meshStandardMaterial color="#5bb8c8" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Pool floor — darker, sunk down for depth illusion */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.06} geometry={floor}>
        <meshStandardMaterial color="#1a6d80" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Water surface — translucent with transmission */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.18} geometry={water}>
        <meshPhysicalMaterial
          color="#38b9d4"
          roughness={0.06}
          metalness={0.05}
          transmission={0.28}
          transparent
          opacity={0.82}
          clearcoat={1}
          clearcoatRoughness={0.08}
          ior={1.33}
        />
      </mesh>
      {/* Entry steps — small descending boxes at one edge */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[w * 0.36 + i * 0.5, 0.12 - i * 0.04, 0]}
          castShadow
        >
          <boxGeometry args={[0.12, 0.55 - i * 0.06, Math.min(2.8, d * 0.2)]} />
          <meshStandardMaterial color="#b9c2c5" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
      {/* Poolside ladder */}
      <mesh position={[w * 0.36 - 0.3, 0.32, d * 0.3]} castShadow>
        <boxGeometry args={[0.08, 0.65, 0.04]} />
        <meshStandardMaterial color="#b9c2c5" metalness={0.75} roughness={0.22} />
      </mesh>
      <mesh position={[w * 0.36 - 0.3, 0.32, -d * 0.3]} castShadow>
        <boxGeometry args={[0.08, 0.65, 0.04]} />
        <meshStandardMaterial color="#b9c2c5" metalness={0.75} roughness={0.22} />
      </mesh>
    </group>
  );
}

/* ── Furniture components ──────────────────────────────────────────── */

function Lounger({ x, z, rotation = 0, scale = 1 }: { x: number; z: number; rotation?: number; scale?: number }) {
  return (
    <group position={[x, 0.24 * scale, z]} rotation-y={rotation} scale={scale}>
      <mesh castShadow>
        <boxGeometry args={[0.9, 0.14, 2.25]} />
        <meshStandardMaterial color="#f3eee4" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.45, -0.82]} rotation-x={-0.48} castShadow>
        <boxGeometry args={[0.9, 0.12, 1.05]} />
        <meshStandardMaterial color="#f3eee4" roughness={0.72} />
      </mesh>
      {[-0.34, 0.34].map((px) => (
        <mesh key={px} position={[px, -0.13, 0]} castShadow>
          <boxGeometry args={[0.08, 0.22, 2.1]} />
          <meshStandardMaterial color="#8d6747" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Parasol({ x, z, scale = 1, color = "#f0d9b4" }: { x: number; z: number; scale?: number; color?: string }) {
  return (
    <group position={[x, 0, z]} scale={scale}>
      <mesh position-y={1.45} castShadow>
        <cylinderGeometry args={[0.045, 0.06, 2.9, 8]} />
        <meshStandardMaterial color="#a87851" roughness={0.75} />
      </mesh>
      <mesh position-y={2.85} castShadow>
        <coneGeometry args={[1.35, 0.48, 12]} />
        <meshStandardMaterial color={color} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Sofa({ x, z, rotation = 0, width = 2.6 }: { x: number; z: number; rotation?: number; width?: number }) {
  return (
    <group position={[x, 0, z]} rotation-y={rotation}>
      <mesh position-y={0.42} castShadow>
        <boxGeometry args={[width, 0.52, 0.85]} />
        <meshStandardMaterial color="#668b80" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.9, 0.34]} castShadow>
        <boxGeometry args={[width, 0.72, 0.18]} />
        <meshStandardMaterial color="#54776f" roughness={0.95} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (width / 2 - 0.1), 0.58, 0]} castShadow>
          <boxGeometry args={[0.2, 0.55, 0.92]} />
          <meshStandardMaterial color="#54776f" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function Armchair({ x, z, rotation = 0, scale = 1 }: { x: number; z: number; rotation?: number; scale?: number }) {
  return (
    <group position={[x, 0, z]} rotation-y={rotation} scale={scale}>
      <mesh position-y={0.38} castShadow>
        <boxGeometry args={[0.85, 0.42, 0.8]} />
        <meshStandardMaterial color="#7a9089" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.72, -0.28]} castShadow>
        <boxGeometry args={[0.85, 0.6, 0.16]} />
        <meshStandardMaterial color="#6a807a" roughness={0.92} />
      </mesh>
      {[-0.32, 0.32].map((sx) => (
        <mesh key={sx} position={[sx, 0.72, 0]} castShadow>
          <boxGeometry args={[0.16, 0.48, 0.82]} />
          <meshStandardMaterial color="#6a807a" roughness={0.92} />
        </mesh>
      ))}
    </group>
  );
}

function TableSet({ x, z, rotation = 0, chairs = 4 }: { x: number; z: number; rotation?: number; chairs?: number }) {
  return (
    <group position={[x, 0, z]} rotation-y={rotation}>
      <mesh position-y={0.72} castShadow>
        <boxGeometry args={[2.4, 0.14, 1.15]} />
        <meshStandardMaterial color="#b18459" roughness={0.82} />
      </mesh>
      <mesh position-y={0.36} castShadow>
        <boxGeometry args={[0.18, 0.72, 0.18]} />
        <meshStandardMaterial color="#574c43" roughness={0.85} />
      </mesh>
      <Instances limit={chairs} castShadow>
        <boxGeometry args={[0.62, 0.75, 0.62]} />
        <meshStandardMaterial color="#66716f" roughness={0.9} />
        {Array.from({ length: chairs }, (_, i) => {
          const side = i % 2 === 0 ? -1 : 1;
          const offset = i < 2 ? -0.65 : 0.65;
          return <Instance key={i} position={[offset, 0.42, side * 1.05]} />;
        })}
      </Instances>
    </group>
  );
}

function SideTable({ x, z, rotation = 0, scale = 1 }: { x: number; z: number; rotation?: number; scale?: number }) {
  return (
    <group position={[x, 0, z]} rotation-y={rotation} scale={scale}>
      <mesh position-y={0.4} castShadow>
        <boxGeometry args={[0.6, 0.06, 0.6]} />
        <meshStandardMaterial color="#b89470" roughness={0.8} />
      </mesh>
      <mesh position-y={0.2} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.4, 6]} />
        <meshStandardMaterial color="#6b5644" roughness={0.85} />
      </mesh>
    </group>
  );
}

function Bed({ x, z, rotation = 0, width = 1.65 }: { x: number; z: number; rotation?: number; width?: number }) {
  return (
    <group position={[x, 0, z]} rotation-y={rotation}>
      <mesh position-y={0.34} castShadow>
        <boxGeometry args={[width, 0.42, 2.35]} />
        <meshStandardMaterial color="#e7ded0" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.59, -0.78]} castShadow>
        <boxGeometry args={[width * 0.86, 0.16, 0.55]} />
        <meshStandardMaterial color="#f4f0e8" roughness={0.98} />
      </mesh>
      <mesh position={[0, 0.66, 1.12]} castShadow>
        <boxGeometry args={[width + 0.12, 0.95, 0.14]} />
        <meshStandardMaterial color="#8a6d58" roughness={0.88} />
      </mesh>
    </group>
  );
}

function Nightstand({ x, z, rotation = 0 }: { x: number; z: number; rotation?: number }) {
  return (
    <group position={[x, 0, z]} rotation-y={rotation}>
      <mesh position-y={0.25} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.42]} />
        <meshStandardMaterial color="#8a6d58" roughness={0.85} />
      </mesh>
      <mesh position-y={0.52} castShadow>
        <boxGeometry args={[0.52, 0.04, 0.44]} />
        <meshStandardMaterial color="#a08470" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.15, 0.23]} castShadow>
        <boxGeometry args={[0.3, 0.08, 0.02]} />
        <meshStandardMaterial color="#5e4a3a" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Wardrobe({ x, z, rotation = 0, width = 1.8 }: { x: number; z: number; rotation?: number; width?: number }) {
  return (
    <group position={[x, 0, z]} rotation-y={rotation}>
      <mesh position-y={1.05} castShadow>
        <boxGeometry args={[width, 2.1, 0.6]} />
        <meshStandardMaterial color="#9a8470" roughness={0.82} />
      </mesh>
      {/* Door divider line */}
      <mesh position={[0, 1.05, 0.31]}>
        <boxGeometry args={[0.02, 2.0, 0.02]} />
        <meshStandardMaterial color="#6b5644" roughness={0.8} />
      </mesh>
      {/* Handles */}
      {[-0.12, 0.12].map((hx) => (
        <mesh key={hx} position={[hx, 1.05, 0.32]} castShadow>
          <boxGeometry args={[0.04, 0.18, 0.03]} />
          <meshStandardMaterial color="#5a4a3a" metalness={0.3} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function Desk({ x, z, rotation = 0 }: { x: number; z: number; rotation?: number }) {
  return (
    <group position={[x, 0, z]} rotation-y={rotation}>
      <mesh position-y={0.72} castShadow>
        <boxGeometry args={[1.3, 0.06, 0.65]} />
        <meshStandardMaterial color="#a08470" roughness={0.8} />
      </mesh>
      {[-0.5, 0.5].map((lx) => (
        <mesh key={lx} position={[lx, 0.36, -0.25]} castShadow>
          <boxGeometry args={[0.08, 0.72, 0.5]} />
          <meshStandardMaterial color="#6b5644" roughness={0.85} />
        </mesh>
      ))}
      <mesh position={[0, 0.36, 0.25]} castShadow>
        <boxGeometry args={[1.2, 0.7, 0.08]} />
        <meshStandardMaterial color="#8a6d58" roughness={0.85} />
      </mesh>
    </group>
  );
}

function OfficeChair({ x, z, rotation = 0 }: { x: number; z: number; rotation?: number }) {
  return (
    <group position={[x, 0, z]} rotation-y={rotation}>
      <mesh position-y={0.45} castShadow>
        <boxGeometry args={[0.55, 0.08, 0.55]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.75, -0.25]} castShadow>
        <boxGeometry args={[0.55, 0.6, 0.1]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
      </mesh>
      <mesh position-y={0.22} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.44, 6]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.4} roughness={0.5} />
      </mesh>
    </group>
  );
}

function Planter({ x, z, scale = 1, color = "#6a8d73" }: { x: number; z: number; scale?: number; color?: string }) {
  return (
    <group position={[x, 0, z]} scale={scale}>
      {/* Pot */}
      <mesh position-y={0.18} castShadow>
        <cylinderGeometry args={[0.32, 0.26, 0.36, 10]} />
        <meshStandardMaterial color="#b89a7a" roughness={0.85} />
      </mesh>
      {/* Foliage */}
      <mesh position-y={0.55} castShadow>
        <sphereGeometry args={[0.4, 10, 8]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      <mesh position={[0.15, 0.7, 0.1]} castShadow>
        <sphereGeometry args={[0.28, 8, 6]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      <mesh position={[-0.12, 0.62, -0.08]} castShadow>
        <sphereGeometry args={[0.24, 8, 6]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
    </group>
  );
}

function ReceptionCounter({ x, z, w, d, rotation = 0 }: { x: number; z: number; w: number; d: number; rotation?: number }) {
  return (
    <group position={[x, 0, z]} rotation-y={rotation}>
      {/* Counter body */}
      <mesh position-y={0.55} castShadow receiveShadow>
        <boxGeometry args={[w, 1.1, d]} />
        <meshStandardMaterial color="#9b704c" roughness={0.8} />
      </mesh>
      {/* Counter top — lighter stone */}
      <mesh position-y={1.15} castShadow>
        <boxGeometry args={[w + 0.08, 0.08, d + 0.08]} />
        <meshStandardMaterial color="#d4cabe" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Front panel detail */}
      <mesh position={[0, 0.45, d / 2 + 0.01]}>
        <boxGeometry args={[w * 0.9, 0.5, 0.02]} />
        <meshStandardMaterial color="#8a6240" roughness={0.75} />
      </mesh>
    </group>
  );
}

function Podium({ x, z, rotation = 0, scale = 1 }: { x: number; z: number; rotation?: number; scale?: number }) {
  return (
    <group position={[x, 0, z]} rotation-y={rotation} scale={scale}>
      <mesh position-y={0.5} castShadow>
        <boxGeometry args={[1.2, 1.0, 0.7]} />
        <meshStandardMaterial color="#6b5644" roughness={0.85} />
      </mesh>
      <mesh position-y={1.05} castShadow>
        <boxGeometry args={[1.3, 0.08, 0.8]} />
        <meshStandardMaterial color="#8a6d58" roughness={0.75} />
      </mesh>
    </group>
  );
}

function BarCounter({ x, z, w, d, rotation = 0 }: { x: number; z: number; w: number; d: number; rotation?: number }) {
  return (
    <group position={[x, 0, z]} rotation-y={rotation}>
      <mesh position-y={0.55} castShadow receiveShadow>
        <boxGeometry args={[w, 1.1, d]} />
        <meshStandardMaterial color="#8a6d58" roughness={0.82} />
      </mesh>
      <mesh position-y={1.12} castShadow>
        <boxGeometry args={[w + 0.06, 0.06, d + 0.06]} />
        <meshStandardMaterial color="#c4b89e" roughness={0.25} metalness={0.15} />
      </mesh>
    </group>
  );
}

/* ── Per-plan furnishings ──────────────────────────────────────────── */

function ResortDetails() {
  const loungers = [
    [234, 107, 0], [234, 115, 0], [234, 123, 0],
    [297, 108, 0], [297, 118, 0], [297, 128, 0],
    [252, 160, Math.PI / 2], [261, 160, Math.PI / 2], [271, 160, Math.PI / 2],
    [242, 170, Math.PI / 2], [262, 170, Math.PI / 2],
    [281, 172, 0], [288, 172, 0],
  ] as const;
  return (
    <group>
      <Pool x={240} z={100} w={50} d={52} radius={20} />
      <Pool x={229} z={147} w={18} d={19} radius={9} />
      {loungers.map(([x, z, rotation], i) => (
        <Lounger key={i} x={x} z={z} rotation={rotation} scale={2.3} />
      ))}
      <Parasol x={233} z={136} scale={2.4} color="#f2c96e" />
      <Parasol x={299} z={145} scale={2.4} color="#e99166" />
      <Parasol x={281} z={177} scale={2.4} color="#f2c96e" />
      <Parasol x={255} z={178} scale={2.4} color="#e99166" />
      <SideTable x={238} z={131} scale={2.2} />
      <SideTable x={293} z={138} scale={2.2} />
      <SideTable x={276} z={167} scale={2.2} />
      <Planter x={225} z={98} scale={2.5} color="#5a8a55" />
      <Planter x={310} z={95} scale={2.5} color="#5a8a55" />
      <Planter x={308} z={160} scale={2.5} color="#5a8a55" />
    </group>
  );
}

function PoolAreaDetails() {
  const loungers = [10, 16, 22, 28, 34, 40].map((x) => (
    <Lounger key={x} x={x} z={31.5} rotation={Math.PI / 2} scale={0.9} />
  ));
  return (
    <group>
      <Pool x={14} z={6} w={28} d={22} radius={7} />
      <Pool x={6} z={24} w={11} d={9} radius={4} />
      {loungers}
      <Parasol x={9} z={8} scale={0.85} color="#f2c96e" />
      <Parasol x={45} z={29} scale={0.9} color="#e99166" />
      <Parasol x={17} z={35} scale={0.8} color="#f2c96e" />
      <TableSet x={49} z={12} rotation={Math.PI / 2} />
      <TableSet x={49} z={25} rotation={Math.PI / 2} chairs={2} />
      <SideTable x={14} z={32} scale={0.9} />
      <SideTable x={26} z={32} scale={0.9} />
      <BarCounter x={43} z={8} w={12} d={9} />
      <Planter x={3} z={2} scale={0.8} color="#5a8a55" />
      <Planter x={54} z={34} scale={0.8} color="#5a8a55" />
      <Planter x={54} z={3} scale={0.8} color="#5a8a55" />
    </group>
  );
}

function ReceptionDetails() {
  return (
    <group>
      <ReceptionCounter x={10.5} z={6} w={7.2} d={1.05} />
      <Sofa x={7.5} z={12.4} width={3.4} />
      <Sofa x={5} z={18.6} rotation={Math.PI / 2} width={3} />
      <Sofa x={9} z={18.6} rotation={-Math.PI / 2} width={3} />
      <Armchair x={13} z={18} rotation={Math.PI} scale={1.1} />
      <Armchair x={2.5} z={13} rotation={0.3} scale={1.1} />
      <TableSet x={14.7} z={19.2} chairs={2} />
      <TableSet x={22} z={12.1} chairs={2} />
      <SideTable x={7.5} z={16} scale={0.9} />
      <SideTable x={6} z={21} scale={0.9} />
      <Planter x={1.5} z={4} scale={0.9} color="#5a8a55" />
      <Planter x={37} z={3} scale={0.9} color="#5a8a55" />
      <Planter x={37} z={22} scale={0.9} color="#5a8a55" />
      <Planter x={1.5} z={22} scale={0.9} color="#5a8a55" />
    </group>
  );
}

function ConventionDetails() {
  return (
    <group>
      <Podium x={39} z={2.2} scale={1.2} />
      <ReceptionCounter x={14} z={7} w={3} d={0.8} rotation={Math.PI / 2} />
      {[23, 27, 31].flatMap((x) => [4, 8, 12].map((z) => (
        <TableSet key={`${x}-${z}`} x={x} z={z} />
      )))}
      <Instances limit={12} castShadow>
        <boxGeometry args={[0.72, 0.78, 0.72]} />
        <meshStandardMaterial color="#5c6c73" roughness={0.9} />
        {[46.5, 49.2, 51.9, 54.2].flatMap((x) =>
          [4, 7, 10].map((z) => <Instance key={`${x}-${z}`} position={[x, 0.42, z]} />),
        )}
      </Instances>
      <Sofa x={14} z={7} rotation={Math.PI / 2} width={3.2} />
      <Sofa x={14} z={13} rotation={Math.PI / 2} width={3.2} />
      <SideTable x={17.5} z={7} scale={0.8} />
      <SideTable x={17.5} z={13} scale={0.8} />
      <Planter x={5} z={3} scale={0.9} color="#5a8a55" />
      <Planter x={5} z={27} scale={0.9} color="#5a8a55" />
      <Planter x={50} z={27} scale={0.9} color="#5a8a55" />
    </group>
  );
}

function ApartmentDetails() {
  return (
    <group>
      {/* North row: beds + nightstands */}
      {Array.from({ length: 9 }, (_, i) => {
        const x = 3.8 + i * 6.6;
        return (
          <group key={`n-${i}`}>
            <Bed x={x} z={7.6} width={1.5} />
            <Nightstand x={x - 1.1} z={7.6} />
            <Nightstand x={x + 1.1} z={7.6} />
          </group>
        );
      })}
      {/* South row: beds + desks + wardrobes */}
      {[
        { x: 8.2 }, { x: 16.2 }, { x: 42.4 }, { x: 48.8 }, { x: 55.2 },
      ].map(({ x }, i) => (
        <group key={`s-${i}`}>
          <Bed x={x} z={22} rotation={Math.PI} width={1.5} />
          <Nightstand x={x + 1.1} z={22} />
          <Wardrobe x={x - 1.8} z={24} width={1.5} />
          <Desk x={x + 1.8} z={24} rotation={Math.PI} />
          <OfficeChair x={x + 1.8} z={23} rotation={0} />
        </group>
      ))}
      {/* Sofas in south rooms */}
      {[6, 13.8, 41.5, 48, 54.5].map((x) => (
        <Sofa key={x} x={x} z={18.2} width={1.6} />
      ))}
    </group>
  );
}

function Furnishings({ plan }: { plan: FloorPlan }) {
  if (plan.id === "resort") return <ResortDetails />;
  if (plan.id === "piscina") return <PoolAreaDetails />;
  if (plan.id === "recepcao") return <ReceptionDetails />;
  if (plan.id === "convencoes") return <ConventionDetails />;
  if (plan.id === "apartamentos") return <ApartmentDetails />;
  return null;
}

function Walls({ plan, opacity }: { plan: FloorPlan; opacity: number }) {
  const thickness = Math.max(0.16, plan.width / 180);

  const items = useMemo(
    () =>
      plan.walls.map((w, i) => {
        const len = Math.hypot(w.x2 - w.x1, w.z2 - w.z1);
        const angle = Math.atan2(w.z2 - w.z1, w.x2 - w.x1);
        const h = w.kind === "vidro" ? plan.wallHeight * 0.92 : plan.wallHeight;
        const color =
          w.kind === "concreto" ? "#8f97a8" : w.kind === "drywall" ? "#b9c0cc" : "#7fd9e8";
        return {
          key: i,
          kind: w.kind,
          len,
          h,
          color,
          position: [(w.x1 + w.x2) / 2, h / 2, (w.z1 + w.z2) / 2] as [number, number, number],
          rotationY: -angle,
        };
      }),
    [plan],
  );

  return (
    <group>
      {items.map((it) => (
        <mesh
          key={it.key}
          castShadow={it.kind === "concreto"}
          receiveShadow
          position={it.position}
          rotation-y={it.rotationY}
        >
          <boxGeometry args={[it.len + thickness, it.h, thickness]} />
          <meshStandardMaterial
            color={it.color}
            roughness={it.kind === "vidro" ? 0.08 : 0.85}
            metalness={it.kind === "vidro" ? 0.3 : 0.05}
            transparent
            opacity={it.kind === "vidro" ? opacity * 0.35 : opacity}
            depthWrite={opacity > 0.85}
          />
        </mesh>
      ))}
    </group>
  );
}

function RoomLabels({ plan }: { plan: FloorPlan }) {
  const size = Math.max(0.3, plan.width / 46);
  return (
    <>
      {plan.rooms.map((r, i) => (
        <Text
          key={`${r.name}-${i}`}
          position={[r.x + r.w / 2, 0.4, r.z + r.d / 2]}
          rotation-x={-Math.PI / 2}
          fontSize={size}
          color="#cfe6ef"
          anchorX="center"
          anchorY="middle"
          outlineWidth={size * 0.035}
          outlineColor="#05080f"
        >
          {r.name.toUpperCase()}
        </Text>
      ))}
    </>
  );
}

function ApMarker({
  ap,
  scale,
  active,
  onSelect,
}: {
  ap: AccessPoint;
  scale: number;
  active: boolean;
  onSelect: () => void;
}) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ring.current) return;
    const t = (state.clock.elapsedTime * 0.6) % 1;
    const s = 0.6 + t * 5.5;
    ring.current.scale.set(s, s, s);
    (ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * (active ? 0.5 : 0.18);
  });

  return (
    <group position={[ap.x, ap.y, ap.z]}>
      <mesh onClick={onSelect} castShadow>
        <sphereGeometry args={[0.16 * scale, 24, 24]} />
        <meshStandardMaterial
          color={active ? "#5ff0d0" : "#4b6b7a"}
          emissive={active ? "#2ad6b2" : "#132228"}
          emissiveIntensity={active ? 1.6 : 0.4}
        />
      </mesh>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position={[0, -ap.y + 0.03, 0]}>
        <ringGeometry args={[0.5 * scale, 0.56 * scale, 48]} />
        <meshBasicMaterial color="#5ff0d0" transparent opacity={0.3} depthWrite={false} />
      </mesh>
      <Html center distanceFactor={14 * scale} position={[0, 0.55 * scale, 0]}>
        <div className={active ? "ap-tag ap-tag-active" : "ap-tag"}>
          {ap.name} · {ap.band} GHz
        </div>
      </Html>
    </group>
  );
}

function Probe({
  plan,
  point,
  aps,
  band,
  scale,
}: {
  plan: FloorPlan;
  point: { x: number; z: number };
  aps: AccessPoint[];
  band: number;
  scale: number;
}) {
  const { dbm, ap } = useMemo(
    () => bestSignal(plan, aps, point.x, point.z, band),
    [plan, aps, point, band],
  );
  const q = quality(dbm);
  const speed = estimateSpeed(dbm, band);

  return (
    <group position={[point.x, 0, point.z]}>
      <mesh position={[0, 0.9 * scale, 0]}>
        <cylinderGeometry args={[0.02 * scale, 0.02 * scale, 1.8 * scale, 8]} />
        <meshBasicMaterial color="#f5c84b" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.24 * scale, 0.3 * scale, 40]} />
        <meshBasicMaterial color="#f5c84b" />
      </mesh>
      <Html center distanceFactor={13 * scale} position={[0, 2.1 * scale, 0]}>
        <div className="probe-card">
          <span className={`probe-dot tone-${q.tone}`} />
          <strong>{dbm.toFixed(0)} dBm</strong>
          <span className="probe-sep" />
          <strong>{speed} Mbps</strong>
          <em>
            {q.label} · {ap ? ap.name : "—"}
          </em>
        </div>
      </Html>
    </group>
  );
}

export function Scene({
  plan,
  mode,
  band,
  heatmapOpacity,
  wallOpacity,
  showLabels,
  activeAps,
  probe,
  onProbe,
  selectedAp,
  onSelectAp,
}: {
  plan: FloorPlan;
  mode: "3d" | "wifi";
  band: number;
  heatmapOpacity: number;
  wallOpacity: number;
  showLabels: boolean;
  activeAps: string[];
  probe: { x: number; z: number } | null;
  onProbe: (p: { x: number; z: number }) => void;
  selectedAp: string | null;
  onSelectAp: (id: string) => void;
}) {
  const wifi = mode === "wifi";
  const aps = useMemo(
    () => (wifi ? plan.accessPoints.filter((a) => activeAps.includes(a.id)) : []),
    [plan, activeAps, wifi],
  );
  const scale = Math.max(1, plan.width / 20);
  const span = Math.max(plan.width, plan.depth);
  const sky = wifi ? "#070b14" : "#9fd4ea";

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!wifi) return;
    e.stopPropagation();
    onProbe({
      x: THREE.MathUtils.clamp(e.point.x + plan.width / 2, 0.2, plan.width - 0.2),
      z: THREE.MathUtils.clamp(e.point.z + plan.depth / 2, 0.2, plan.depth - 0.2),
    });
  };

  return (
    <>
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[sky, span * 1.6, span * 4.4]} />
      <hemisphereLight args={["#d7eff8", "#6e7652", wifi ? 0.35 : 0.72]} />
      <ambientLight intensity={wifi ? 0.35 : 0.5} />
      <directionalLight
        position={[span * 0.6, span, span * 0.5]}
        intensity={wifi ? 1.5 : 2.1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-span}
        shadow-camera-right={span}
        shadow-camera-top={span}
        shadow-camera-bottom={-span}
        shadow-bias={-0.0005}
      />
      <Environment>
        <Lightformer intensity={wifi ? 1.6 : 2.4} position={[0, 8, 0]} scale={[14, 14, 1]} />
        <Lightformer
          intensity={1}
          color={wifi ? "#5ff0d0" : "#cfe7f5"}
          position={[-8, 2, 2]}
          rotation-y={Math.PI / 2}
          scale={[20, 2, 1]}
        />
      </Environment>

      <group position={[-plan.width / 2, 0, -plan.depth / 2]}>
        {/* Piso clicável */}
        <mesh
          rotation-x={-Math.PI / 2}
          position={[plan.width / 2, 0, plan.depth / 2]}
          receiveShadow
          onClick={handleClick}
        >
          <planeGeometry args={[plan.width, plan.depth]} />
          <meshStandardMaterial
            color={wifi ? (plan.outdoor ? "#101d1a" : "#141b28") : plan.outdoor ? "#4d7a45" : "#efeae0"}
            roughness={0.95}
            metalness={0.05}
          />
        </mesh>

        {wifi && (
          <gridHelper
            args={[span, Math.min(80, Math.round(span)), "#22304a", "#182031"]}
            position={[plan.width / 2, 0.015, plan.depth / 2]}
          />
        )}

        {!wifi && <Surfaces plan={plan} />}
        {!wifi && <Buildings plan={plan} />}
        {!wifi && <Trees plan={plan} />}
        {!wifi && <Furnishings plan={plan} />}

        {wifi && (
          <Heatmap plan={plan} aps={aps} band={band} opacity={heatmapOpacity} height={0.04} />
        )}

        {showLabels && <RoomLabels plan={plan} />}
        <Walls plan={plan} opacity={wifi ? wallOpacity : 1} />

        {aps.map((ap) => (
          <ApMarker
            key={ap.id}
            ap={ap}
            scale={scale}
            active={selectedAp === ap.id}
            onSelect={() => onSelectAp(ap.id)}
          />
        ))}

        {wifi && probe && (
          <Probe plan={plan} point={probe} aps={aps} band={band} scale={scale} />
        )}
      </group>

      <OrbitControls
        makeDefault
        enablePan
        minDistance={span * 0.25}
        maxDistance={span * 3}
        maxPolarAngle={Math.PI / 2.15}
        target={[0, plan.wallHeight * 0.3, 0]}
      />
    </>
  );
}
