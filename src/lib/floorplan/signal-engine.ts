import type { AccessPoint, FloorPlan } from "./types";

/** Interseção segmento-segmento */
function segmentsCross(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  cx: number,
  cz: number,
  dx: number,
  dz: number,
) {
  const d1 = (bx - ax) * (cz - az) - (bz - az) * (cx - ax);
  const d2 = (bx - ax) * (dz - az) - (bz - az) * (dx - ax);
  const d3 = (dx - cx) * (az - cz) - (dz - cz) * (ax - cx);
  const d4 = (dx - cx) * (bz - cz) - (dz - cz) * (bx - cx);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

/** Path loss log-distância + atenuação por paredes atravessadas. Retorna dBm. */
export function signalAt(
  plan: FloorPlan,
  ap: AccessPoint,
  x: number,
  z: number,
  band?: number,
): number {
  const f = band ?? ap.band;
  const dist = Math.max(0.6, Math.hypot(x - ap.x, z - ap.z));
  // Free space path loss (d em m, f em GHz)
  const fspl = 20 * Math.log10(dist) + 20 * Math.log10(f * 1000) - 27.55;
  // Expoente extra indoor (menor em áreas abertas)
  const indoor = (plan.outdoor ? 3 : 8) * Math.log10(dist);
  let wallLoss = 0;
  for (const w of plan.walls) {
    if (segmentsCross(ap.x, ap.z, x, z, w.x1, w.z1, w.x2, w.z2)) {
      // Bandas mais altas sofrem mais
      wallLoss += w.att * (f >= 5 ? 1.25 : 1);
    }
  }
  return ap.txPower - fspl - indoor - wallLoss;
}

export function bestSignal(
  plan: FloorPlan,
  aps: AccessPoint[],
  x: number,
  z: number,
  band?: number,
): { dbm: number; ap: AccessPoint | null } {
  let best = -120;
  let bestAp: AccessPoint | null = null;
  for (const ap of aps) {
    const v = signalAt(plan, ap, x, z, band);
    if (v > best) {
      best = v;
      bestAp = ap;
    }
  }
  return { dbm: best, ap: bestAp };
}

/** Throughput estimado (Mbps) a partir do RSSI e da banda. */
export function estimateSpeed(dbm: number, band: number): number {
  const maxRate = band >= 6 ? 2400 : band >= 5 ? 1200 : 300;
  // -40 dBm => ~100%, -85 dBm => ~0%
  const q = Math.max(0, Math.min(1, (dbm + 85) / 45));
  const eff = Math.pow(q, 1.9);
  return Math.round(maxRate * eff);
}

export function quality(dbm: number) {
  if (dbm >= -50) return { label: "Excelente", tone: "excellent" as const };
  if (dbm >= -60) return { label: "Ótimo", tone: "good" as const };
  if (dbm >= -70) return { label: "Bom", tone: "ok" as const };
  if (dbm >= -80) return { label: "Fraco", tone: "weak" as const };
  return { label: "Sem cobertura", tone: "dead" as const };
}

type Stop = { at: number; rgb: [number, number, number] };

const COLOR_STOPS: Stop[] = [
  { at: -95, rgb: [12, 18, 34] },
  { at: -85, rgb: [46, 34, 92] },
  { at: -75, rgb: [26, 92, 150] },
  { at: -65, rgb: [16, 160, 152] },
  { at: -55, rgb: [86, 200, 96] },
  { at: -45, rgb: [230, 200, 70] },
  { at: -35, rgb: [245, 122, 60] },
];

/** Cor RGB do heatmap para um RSSI. */
export function signalColor(dbm: number): [number, number, number] {
  const first = COLOR_STOPS[0]!;
  const last = COLOR_STOPS[COLOR_STOPS.length - 1]!;
  if (dbm <= first.at) return first.rgb;
  if (dbm >= last.at) return last.rgb;
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const a = COLOR_STOPS[i]!;
    const b = COLOR_STOPS[i + 1]!;
    if (dbm >= a.at && dbm <= b.at) {
      const t = (dbm - a.at) / (b.at - a.at);
      return [
        Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * t),
        Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * t),
        Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * t),
      ];
    }
  }
  return first.rgb;
}
