import { Environment, Html, Lightformer, OrbitControls, Text } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import {
  PLAN_D,
  PLAN_W,
  WALL_H,
  accessPoints as allAps,
  bestSignal,
  estimateSpeed,
  quality,
  rooms,
  walls,
  type AccessPoint,
} from "@/lib/floorplan";
import { Heatmap } from "./Heatmap";

const WALL_T = 0.16;

function Walls({ opacity }: { opacity: number }) {
  return (
    <group>
      {walls.map((w, i) => {
        const len = Math.hypot(w.x2 - w.x1, w.z2 - w.z1);
        const angle = Math.atan2(w.z2 - w.z1, w.x2 - w.x1);
        const h = w.kind === "vidro" ? WALL_H * 0.92 : WALL_H;
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
            <boxGeometry args={[len + WALL_T, h, WALL_T]} />
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

function RoomLabels() {
  return (
    <>
      {rooms.map((r) => (
        <Text
          key={r.name}
          position={[r.x + r.w / 2, 0.06, r.z + r.d / 2]}
          rotation-x={-Math.PI / 2}
          fontSize={0.34}
          color="#cfe6ef"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.012}
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
  active,
  onSelect,
}: {
  ap: AccessPoint;
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
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshStandardMaterial
          color={active ? "#5ff0d0" : "#4b6b7a"}
          emissive={active ? "#2ad6b2" : "#132228"}
          emissiveIntensity={active ? 1.6 : 0.4}
        />
      </mesh>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position={[0, -ap.y + 0.03, 0]}>
        <ringGeometry args={[0.5, 0.56, 48]} />
        <meshBasicMaterial color="#5ff0d0" transparent opacity={0.3} depthWrite={false} />
      </mesh>
      <Html center distanceFactor={14} position={[0, 0.55, 0]}>
        <div className={active ? "ap-tag ap-tag-active" : "ap-tag"}>
          {ap.name} · {ap.band} GHz
        </div>
      </Html>
    </group>
  );
}

function Probe({
  point,
  aps,
  band,
}: {
  point: { x: number; z: number };
  aps: AccessPoint[];
  band: number;
}) {
  const { dbm, ap } = useMemo(
    () => bestSignal(aps, point.x, point.z, band),
    [aps, point, band],
  );
  const q = quality(dbm);
  const speed = estimateSpeed(dbm, band);

  return (
    <group position={[point.x, 0, point.z]}>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.8, 8]} />
        <meshBasicMaterial color="#f5c84b" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.24, 0.3, 40]} />
        <meshBasicMaterial color="#f5c84b" />
      </mesh>
      <Html center distanceFactor={13} position={[0, 2.1, 0]}>
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
  const aps = useMemo(() => allAps.filter((a) => activeAps.includes(a.id)), [activeAps]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onProbe({
      x: THREE.MathUtils.clamp(e.point.x, 0.2, PLAN_W - 0.2),
      z: THREE.MathUtils.clamp(e.point.z, 0.2, PLAN_D - 0.2),
    });
  };

  return (
    <>
      <color attach="background" args={["#070b14"]} />
      <fog attach="fog" args={["#070b14", 24, 62]} />
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[10, 16, 8]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
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

      <group position={[-PLAN_W / 2, 0, -PLAN_D / 2]}>
        {/* Piso clicável */}
        <mesh
          rotation-x={-Math.PI / 2}
          position={[PLAN_W / 2, 0, PLAN_D / 2]}
          receiveShadow
          onClick={handleClick}
        >
          <planeGeometry args={[PLAN_W, PLAN_D]} />
          <meshStandardMaterial color="#141b28" roughness={0.95} metalness={0.05} />
        </mesh>

        <gridHelper
          args={[Math.max(PLAN_W, PLAN_D), Math.max(PLAN_W, PLAN_D), "#22304a", "#182031"]}
          position={[PLAN_W / 2, 0.015, PLAN_D / 2]}
        />

        <Heatmap aps={aps} band={band} opacity={heatmapOpacity} height={0.04} />

        {showLabels && <RoomLabels />}
        <Walls opacity={wallOpacity} />

        {aps.map((ap) => (
          <ApMarker
            key={ap.id}
            ap={ap}
            active={selectedAp === ap.id}
            onSelect={() => onSelectAp(ap.id)}
          />
        ))}

        {probe && <Probe point={probe} aps={aps} band={band} />}
      </group>

      <OrbitControls
        makeDefault
        enablePan
        minDistance={6}
        maxDistance={44}
        maxPolarAngle={Math.PI / 2.15}
        target={[0, 0.8, 0]}
      />
    </>
  );
}
