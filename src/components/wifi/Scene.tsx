import { Environment, Html, Lightformer, OrbitControls, Text } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import {
  bestSignal,
  estimateSpeed,
  quality,
  type AccessPoint,
  type FloorPlan,
} from "@/lib/floorplan";
import { Heatmap } from "./Heatmap";

function Walls({ plan, opacity }: { plan: FloorPlan; opacity: number }) {
  const thickness = Math.max(0.16, plan.width / 180);
  return (
    <group>
      {plan.walls.map((w, i) => {
        const len = Math.hypot(w.x2 - w.x1, w.z2 - w.z1);
        const angle = Math.atan2(w.z2 - w.z1, w.x2 - w.x1);
        const h = w.kind === "vidro" ? plan.wallHeight * 0.92 : plan.wallHeight;
        const color =
          w.kind === "concreto" ? "#8f97a8" : w.kind === "drywall" ? "#b9c0cc" : "#7fd9e8";
        return (
          <mesh
            key={i}
            castShadow
            receiveShadow
            position={[(w.x1 + w.x2) / 2, h / 2, (w.z1 + w.z2) / 2]}
            rotation-y={-angle}
          >
            <boxGeometry args={[len + thickness, h, thickness]} />
            <meshStandardMaterial
              color={color}
              roughness={w.kind === "vidro" ? 0.08 : 0.85}
              metalness={w.kind === "vidro" ? 0.3 : 0.05}
              transparent
              opacity={w.kind === "vidro" ? opacity * 0.35 : opacity}
              depthWrite={opacity > 0.85}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function RoomLabels({ plan }: { plan: FloorPlan }) {
  const size = Math.max(0.3, plan.width / 46);
  return (
    <>
      {plan.rooms.map((r) => (
        <Text
          key={r.name}
          position={[r.x + r.w / 2, 0.06, r.z + r.d / 2]}
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
  const aps = useMemo(
    () => plan.accessPoints.filter((a) => activeAps.includes(a.id)),
    [plan, activeAps],
  );
  const scale = Math.max(1, plan.width / 20);
  const span = Math.max(plan.width, plan.depth);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onProbe({
      x: THREE.MathUtils.clamp(e.point.x + plan.width / 2, 0.2, plan.width - 0.2),
      z: THREE.MathUtils.clamp(e.point.z + plan.depth / 2, 0.2, plan.depth - 0.2),
    });
  };

  return (
    <>
      <color attach="background" args={["#070b14"]} />
      <fog attach="fog" args={["#070b14", span * 1.6, span * 4.2]} />
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[span * 0.6, span, span * 0.5]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-span}
        shadow-camera-right={span}
        shadow-camera-top={span}
        shadow-camera-bottom={-span}
      />
      <Environment>
        <Lightformer intensity={1.6} position={[0, 8, 0]} scale={[14, 14, 1]} />
        <Lightformer
          intensity={1}
          color="#5ff0d0"
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
            color={plan.outdoor ? "#101d1a" : "#141b28"}
            roughness={0.95}
            metalness={0.05}
          />
        </mesh>

        <gridHelper
          args={[span, Math.min(80, Math.round(span)), "#22304a", "#182031"]}
          position={[plan.width / 2, 0.015, plan.depth / 2]}
        />

        <Heatmap plan={plan} aps={aps} band={band} opacity={heatmapOpacity} height={0.04} />

        {showLabels && <RoomLabels plan={plan} />}
        <Walls plan={plan} opacity={wallOpacity} />

        {aps.map((ap) => (
          <ApMarker
            key={ap.id}
            ap={ap}
            scale={scale}
            active={selectedAp === ap.id}
            onSelect={() => onSelectAp(ap.id)}
          />
        ))}

        {probe && <Probe plan={plan} point={probe} aps={aps} band={band} scale={scale} />}
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
