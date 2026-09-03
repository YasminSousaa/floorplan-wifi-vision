// Modelo do apartamento: paredes em segmentos (metros), com atenuação em dB.

export type Wall = {
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  h?: number;
  /** Atenuação em dB ao atravessar */
  att: number;
  kind: "concreto" | "drywall" | "vidro";
};

export type Room = {
  name: string;
  x: number;
  z: number;
  w: number;
  d: number;
};

export type AccessPoint = {
  id: string;
  name: string;
  x: number;
  z: number;
  y: number;
  /** Potência de transmissão em dBm (EIRP) */
  txPower: number;
  /** Frequência em GHz */
  band: 2.4 | 5 | 6;
};

export const PLAN_W = 16;
export const PLAN_D = 11;
export const WALL_H = 2.7;

const C = 12; // concreto
const D = 4.5; // drywall
const G = 2.5; // vidro

export const rooms: Room[] = [
  { name: "Sala de Estar", x: 0, z: 0, w: 7, d: 6.5 },
  { name: "Cozinha", x: 7, z: 0, w: 4.5, d: 4 },
  { name: "Escritório", x: 11.5, z: 0, w: 4.5, d: 4 },
  { name: "Suíte", x: 7, z: 4, w: 5, d: 7 },
  { name: "Quarto 2", x: 12, z: 4, w: 4, d: 7 },
  { name: "Hall", x: 0, z: 6.5, w: 7, d: 4.5 },
];

export const walls: Wall[] = [
  // Perímetro (concreto)
  { x1: 0, z1: 0, x2: PLAN_W, z2: 0, att: C, kind: "concreto" },
  { x1: PLAN_W, z1: 0, x2: PLAN_W, z2: PLAN_D, att: C, kind: "concreto" },
  { x1: PLAN_W, z1: PLAN_D, x2: 0, z2: PLAN_D, att: C, kind: "concreto" },
  { x1: 0, z1: PLAN_D, x2: 0, z2: 0, att: C, kind: "concreto" },
  // Divisórias internas
  { x1: 7, z1: 0, x2: 7, z2: 4, att: D, kind: "drywall" },
  { x1: 11.5, z1: 0, x2: 11.5, z2: 4, att: D, kind: "drywall" },
  { x1: 7, z1: 4, x2: PLAN_W, z2: 4, att: C, kind: "concreto" },
  { x1: 12, z1: 4, x2: 12, z2: PLAN_D, att: D, kind: "drywall" },
  { x1: 7, z1: 4, x2: 7, z2: PLAN_D, att: C, kind: "concreto" },
  { x1: 0, z1: 6.5, x2: 5, z2: 6.5, att: D, kind: "drywall" },
  // Fachada de vidro da sala
  { x1: 0, z1: 0.02, x2: 7, z2: 0.02, att: G, kind: "vidro" },
];

export const accessPoints: AccessPoint[] = [
  { id: "ap1", name: "Roteador Principal", x: 3.4, z: 3.2, y: 1.6, txPower: 22, band: 5 },
  { id: "ap2", name: "Mesh Suíte", x: 9.4, z: 8.2, y: 1.1, txPower: 18, band: 5 },
  { id: "ap3", name: "Mesh Cozinha", x: 9.2, z: 1.6, y: 2.2, txPower: 18, band: 2.4 },
];

/** Interseção segmento-segmento */
function segmentsCross(
  ax: number, az: number, bx: number, bz: number,
  cx: number, cz: number, dx: number, dz: number,
) {
  const d1 = (bx - ax) * (cz - az) - (bz - az) * (cx - ax);
  const d2 = (bx - ax) * (dz - az) - (bz - az) * (dx - ax);
  const d3 = (dx - cx) * (az - cz) - (dz - cz) * (ax - cx);
  const d4 = (dx - cx) * (bz - cz) - (dz - cz) * (bx - cx);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

/** Path loss log-distância + atenuação por paredes atravessadas. Retorna dBm. */
export function signalAt(ap: AccessPoint, x: number, z: number, band?: number): number {
  const f = band ?? ap.band;
  const dist = Math.max(0.6, Math.hypot(x - ap.x, z - ap.z));
  // Free space path loss (d em m, f em GHz)
  const fspl = 20 * Math.log10(dist) + 20 * Math.log10(f * 1000) - 27.55;
  // Expoente extra indoor
  const indoor = 8 * Math.log10(dist);
  let wallLoss = 0;
  for (const w of walls) {
    if (segmentsCross(ap.x, ap.z, x, z, w.x1, w.z1, w.x2, w.z2)) {
      // Bandas mais altas sofrem mais
      wallLoss += w.att * (f >= 5 ? 1.25 : 1);
    }
  }
  return ap.txPower - fspl - indoor - wallLoss;
}

export function bestSignal(
  aps: AccessPoint[],
  x: number,
  z: number,
  band?: number,
): { dbm: number; ap: AccessPoint | null } {
  let best = -120;
  let bestAp: AccessPoint | null = null;
  for (const ap of aps) {
    const v = signalAt(ap, x, z, band);
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

/** Cor RGB do heatmap para um RSSI. */
export function signalColor(dbm: number): [number, number, number] {
  const stops: Array<[number, [number, number, number]]> = [
    [-95, [12, 18, 34]],
    [-85, [46, 34, 92]],
    [-75, [26, 92, 150]],
    [-65, [16, 160, 152]],
    [-55, [86, 200, 96]],
    [-45, [230, 200, 70]],
    [-35, [245, 122, 60]],
  ];
  if (dbm <= stops[0][0]) return stops[0][1];
  if (dbm >= stops[stops.length - 1][0]) return stops[stops.length - 1][1];
  for (let i = 0; i < stops.length - 1; i++) {
    const [a, ca] = stops[i];
    const [b, cb] = stops[i + 1];
    if (dbm >= a && dbm <= b) {
      const t = (dbm - a) / (b - a);
      return [
        Math.round(ca[0] + (cb[0] - ca[0]) * t),
        Math.round(ca[1] + (cb[1] - ca[1]) * t),
        Math.round(ca[2] + (cb[2] - ca[2]) * t),
      ];
    }
  }
  return stops[0][1];
}
