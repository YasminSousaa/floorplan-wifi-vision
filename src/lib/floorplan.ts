// Modelo de plantas: paredes em segmentos (metros), com atenuação em dB.

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

export type FloorPlan = {
  id: string;
  name: string;
  subtitle: string;
  /** Largura (eixo X) em metros */
  width: number;
  /** Profundidade (eixo Z) em metros */
  depth: number;
  wallHeight: number;
  outdoor?: boolean;
  rooms: Room[];
  walls: Wall[];
  accessPoints: AccessPoint[];
};

const C = 12; // concreto
const D = 4.5; // drywall
const G = 2.5; // vidro

/** Retângulo fechado de paredes */
function box(
  x: number,
  z: number,
  w: number,
  d: number,
  att: number,
  kind: Wall["kind"],
): Wall[] {
  return [
    { x1: x, z1: z, x2: x + w, z2: z, att, kind },
    { x1: x + w, z1: z, x2: x + w, z2: z + d, att, kind },
    { x1: x + w, z1: z + d, x2: x, z2: z + d, att, kind },
    { x1: x, z1: z + d, x2: x, z2: z, att, kind },
  ];
}

/* ------------------------------------------------------------------ */
/* 1. Resort completo (vista de cima)                                  */
/* ------------------------------------------------------------------ */

const RESORT_W = 420;
const RESORT_D = 290;

const resort: FloorPlan = {
  id: "resort",
  name: "Resort · Vista Geral",
  subtitle: "Costa Serena Resort & Spa — 18 hectares",
  width: RESORT_W,
  depth: RESORT_D,
  wallHeight: 9,
  outdoor: true,
  rooms: [
    { name: "Estacionamento", x: 30, z: 22, w: 80, d: 30 },
    { name: "Lobby / Recepção", x: 130, z: 40, w: 60, d: 40 },
    { name: "Centro de Convenções", x: 225, z: 26, w: 120, d: 48 },
    { name: "Bloco A", x: 12, z: 60, w: 100, d: 30 },
    { name: "Bloco B", x: 268, z: 68, w: 110, d: 32 },
    { name: "Restaurantes", x: 205, z: 78, w: 70, d: 32 },
    { name: "Piscina Principal", x: 96, z: 96, w: 76, d: 48 },
    { name: "Quadras Esportivas", x: 205, z: 122, w: 76, d: 44 },
    { name: "Bloco C", x: 14, z: 148, w: 92, d: 34 },
    { name: "Bloco D", x: 262, z: 152, w: 112, d: 36 },
    { name: "Piscina Secundária", x: 112, z: 158, w: 60, d: 38 },
    { name: "Jardins", x: 186, z: 172, w: 60, d: 40 },
    { name: "Praia Privativa", x: 40, z: 220, w: 320, d: 50 },
  ],
  walls: [
    ...box(12, 60, 100, 30, C, "concreto"),
    ...box(268, 68, 110, 32, C, "concreto"),
    ...box(14, 148, 92, 34, C, "concreto"),
    ...box(262, 152, 112, 36, C, "concreto"),
    ...box(225, 26, 120, 48, C, "concreto"),
    ...box(130, 40, 60, 40, C, "concreto"),
    ...box(205, 78, 70, 32, G, "vidro"),
  ],
  accessPoints: [
    { id: "r-lobby", name: "AP Lobby", x: 160, z: 60, y: 4, txPower: 24, band: 5 },
    { id: "r-conv", name: "AP Convenções", x: 285, z: 50, y: 5, txPower: 26, band: 5 },
    { id: "r-pool", name: "AP Piscina", x: 134, z: 120, y: 4, txPower: 24, band: 2.4 },
    { id: "r-bloco-a", name: "AP Bloco A", x: 62, z: 75, y: 6, txPower: 22, band: 5 },
    { id: "r-bloco-b", name: "AP Bloco B", x: 323, z: 84, y: 6, txPower: 22, band: 5 },
    { id: "r-bloco-c", name: "AP Bloco C", x: 60, z: 165, y: 6, txPower: 22, band: 5 },
    { id: "r-bloco-d", name: "AP Bloco D", x: 318, z: 170, y: 6, txPower: 22, band: 5 },
    { id: "r-praia", name: "AP Praia", x: 200, z: 232, y: 5, txPower: 24, band: 2.4 },
  ],
};

/* ------------------------------------------------------------------ */
/* 2. Recepção / Lobby                                                 */
/* ------------------------------------------------------------------ */

const REC_W = 36;
const REC_D = 24;

const recepcao: FloorPlan = {
  id: "recepcao",
  name: "Recepção / Lobby",
  subtitle: "Pavimento térreo — acesso principal",
  width: REC_W,
  depth: REC_D,
  wallHeight: 3.2,
  rooms: [
    { name: "Banheiro Masculino", x: 1, z: 1, w: 6.5, d: 4 },
    { name: "Banheiro Feminino", x: 1, z: 5, w: 6.5, d: 3 },
    { name: "Banheiro Acessível", x: 1, z: 8, w: 6.5, d: 3.5 },
    { name: "Recepção", x: 9, z: 1, w: 12, d: 7 },
    { name: "Administração", x: 21.5, z: 1, w: 7.5, d: 6 },
    { name: "Elevadores", x: 29, z: 1, w: 6, d: 6 },
    { name: "Escada", x: 29, z: 7, w: 6, d: 5 },
    { name: "Concierge", x: 23, z: 8, w: 4.5, d: 3 },
    { name: "Lobby", x: 9, z: 9, w: 13, d: 9 },
    { name: "Área de Espera", x: 1, z: 12, w: 8, d: 7 },
    { name: "Lounge", x: 22, z: 12, w: 12, d: 8 },
    { name: "Entrada Principal", x: 9, z: 19.5, w: 16, d: 4 },
  ],
  walls: [
    ...box(0, 0, REC_W, REC_D, C, "concreto"),
    ...box(1, 1, 6.5, 10.5, D, "drywall"),
    { x1: 1, z1: 5, x2: 7.5, z2: 5, att: D, kind: "drywall" },
    { x1: 1, z1: 8, x2: 7.5, z2: 8, att: D, kind: "drywall" },
    ...box(21.5, 1, 7.5, 6, D, "drywall"),
    ...box(29, 1, 6, 11, C, "concreto"),
    { x1: 29, z1: 7, x2: 35, z2: 7, att: C, kind: "concreto" },
    { x1: 22, z1: 8, x2: 27.5, z2: 8, att: D, kind: "drywall" },
    { x1: 22, z1: 8, x2: 22, z2: 11, att: D, kind: "drywall" },
    // fachada de vidro (entrada)
    { x1: 0, z1: 19.4, x2: REC_W, z2: 19.4, att: G, kind: "vidro" },
  ],
  accessPoints: [
    { id: "rc1", name: "AP Recepção", x: 15, z: 5, y: 2.9, txPower: 22, band: 5 },
    { id: "rc2", name: "AP Lobby", x: 16, z: 13.5, y: 2.9, txPower: 22, band: 5 },
    { id: "rc3", name: "AP Lounge", x: 28, z: 15.5, y: 2.6, txPower: 18, band: 2.4 },
    { id: "rc4", name: "AP Administração", x: 25, z: 3.5, y: 2.6, txPower: 18, band: 5 },
  ],
};

/* ------------------------------------------------------------------ */
/* 3. Centro de convenções                                             */
/* ------------------------------------------------------------------ */

const CONV_W = 46;
const CONV_D = 32;

const convencoes: FloorPlan = {
  id: "convencoes",
  name: "Centro de Convenções",
  subtitle: "Salão principal, salas de reunião e coffee break",
  width: CONV_W,
  depth: CONV_D,
  wallHeight: 5.5,
  rooms: [
    { name: "Sala de Reunião 01", x: 0.5, z: 1, w: 7, d: 5.5 },
    { name: "Sala de Reunião 02", x: 0.5, z: 6.5, w: 7, d: 5.5 },
    { name: "Sala de Reunião 03", x: 0.5, z: 12, w: 7, d: 5.5 },
    { name: "Sala de Reunião 04", x: 0.5, z: 17.5, w: 7, d: 5.5 },
    { name: "Palco", x: 15, z: 1, w: 14, d: 4 },
    { name: "Salão Principal", x: 10, z: 5, w: 25, d: 12 },
    { name: "Backstage", x: 35, z: 1, w: 10, d: 5 },
    { name: "Sala Técnica", x: 35, z: 6, w: 10, d: 4 },
    { name: "Depósito", x: 35, z: 10, w: 10, d: 4 },
    { name: "Hall Principal", x: 9, z: 17, w: 20, d: 9 },
    { name: "Banheiros", x: 29, z: 16, w: 6, d: 8 },
    { name: "Área de Coffee Break", x: 35, z: 14, w: 10.5, d: 12 },
    { name: "Entrada Principal", x: 15, z: 27, w: 12, d: 4 },
  ],
  walls: [
    ...box(0, 0, CONV_W, CONV_D, C, "concreto"),
    ...box(0.5, 1, 7, 22, D, "drywall"),
    { x1: 0.5, z1: 6.5, x2: 7.5, z2: 6.5, att: D, kind: "drywall" },
    { x1: 0.5, z1: 12, x2: 7.5, z2: 12, att: D, kind: "drywall" },
    { x1: 0.5, z1: 17.5, x2: 7.5, z2: 17.5, att: D, kind: "drywall" },
    // salão principal
    ...box(9, 1, 26, 16, C, "concreto"),
    // bloco técnico / backstage
    ...box(35, 1, 10, 13, C, "concreto"),
    { x1: 35, z1: 6, x2: 45, z2: 6, att: D, kind: "drywall" },
    { x1: 35, z1: 10, x2: 45, z2: 10, att: D, kind: "drywall" },
    // banheiros
    ...box(29, 16, 6, 8, D, "drywall"),
    // coffee break
    ...box(34.5, 14, 11, 12, G, "vidro"),
    // fachada
    { x1: 8, z1: 26.5, x2: 34, z2: 26.5, att: G, kind: "vidro" },
  ],
  accessPoints: [
    { id: "cv1", name: "AP Salão Norte", x: 16, z: 6, y: 5, txPower: 24, band: 5 },
    { id: "cv2", name: "AP Salão Sul", x: 28, z: 14, y: 5, txPower: 24, band: 5 },
    { id: "cv3", name: "AP Hall", x: 18, z: 21, y: 3.4, txPower: 22, band: 5 },
    { id: "cv4", name: "AP Salas de Reunião", x: 4, z: 12, y: 2.8, txPower: 18, band: 2.4 },
    { id: "cv5", name: "AP Coffee Break", x: 40, z: 20, y: 3, txPower: 18, band: 5 },
  ],
};

/* ------------------------------------------------------------------ */
/* 4. Piscina / área de lazer                                          */
/* ------------------------------------------------------------------ */

const POOL_W = 60;
const POOL_D = 40;

const piscina: FloorPlan = {
  id: "piscina",
  name: "Piscina & Área de Lazer",
  subtitle: "Deck, bar molhado e vestiários",
  width: POOL_W,
  depth: POOL_D,
  wallHeight: 3,
  outdoor: true,
  rooms: [
    { name: "Piscina Secundária", x: 16, z: 3, w: 20, d: 8 },
    { name: "Piscina Principal", x: 11, z: 11, w: 27, d: 16 },
    { name: "Piscina Infantil", x: 6, z: 26, w: 10, d: 6 },
    { name: "Bar da Piscina", x: 41, z: 8, w: 15, d: 12 },
    { name: "Vestiários", x: 48, z: 22, w: 10, d: 12 },
    { name: "Banheiros", x: 40, z: 22, w: 8, d: 12 },
    { name: "Deck / Solário", x: 2, z: 4, w: 8, d: 14 },
    { name: "Jardins", x: 20, z: 32, w: 16, d: 6 },
  ],
  walls: [
    ...box(41, 8, 15, 12, D, "drywall"),
    ...box(40, 22, 18, 12, C, "concreto"),
    { x1: 48, z1: 22, x2: 48, z2: 34, att: D, kind: "drywall" },
    { x1: 40, z1: 28, x2: 48, z2: 28, att: D, kind: "drywall" },
  ],
  accessPoints: [
    { id: "ps1", name: "AP Deck Norte", x: 24, z: 8, y: 3.5, txPower: 22, band: 5 },
    { id: "ps2", name: "AP Deck Sul", x: 22, z: 28, y: 3.5, txPower: 22, band: 2.4 },
    { id: "ps3", name: "AP Bar da Piscina", x: 47, z: 14, y: 2.8, txPower: 18, band: 5 },
    { id: "ps4", name: "AP Vestiários", x: 50, z: 27, y: 2.6, txPower: 16, band: 2.4 },
  ],
};

/* ------------------------------------------------------------------ */
/* 5. Andar de apartamentos                                            */
/* ------------------------------------------------------------------ */

const APT_W = 56;
const APT_D = 27;
const aptTopNames = ["Apto 01", "Apto 02", "Apto 03", "Apto 04", "Apto 05"];
const aptBottomNames = ["Apto 06", "Apto 07", "Apto 08", "Apto 09", "Apto 10"];

const aptRooms: Room[] = [];
const aptWalls: Wall[] = [...box(0, 0, APT_W, APT_D, C, "concreto")];

// fileira superior: 3 aptos à esquerda, hall de elevadores, 2 à direita
const topSlots = [1, 8.6, 16.2, 31, 38.6];
topSlots.forEach((x, i) => {
  aptRooms.push({ name: aptTopNames[i]!, x, z: 1, w: 7, d: 10 });
  aptWalls.push(...box(x, 1, 7, 10, D, "drywall"));
});
aptRooms.push({ name: "Hall Elevadores", x: 23.5, z: 1, w: 7, d: 10 });
aptWalls.push(...box(23.5, 1, 7, 10, C, "concreto"));

aptRooms.push({ name: "Corredor Central", x: 7, z: 11.5, w: 48, d: 3.5 });
aptWalls.push(
  { x1: 7, z1: 11.4, x2: APT_W, z2: 11.4, att: D, kind: "drywall" },
  { x1: 7, z1: 15, x2: APT_W, z2: 15, att: D, kind: "drywall" },
);

const bottomSlots = [8.6, 17.5, 26.4, 35.3, 44.2];
bottomSlots.forEach((x, i) => {
  aptRooms.push({ name: aptBottomNames[i]!, x, z: 15.5, w: 8, d: 10.5 });
  aptWalls.push(...box(x, 15.5, 8, 10.5, D, "drywall"));
});

aptRooms.push({ name: "Escada 01", x: 0.5, z: 12, w: 6, d: 13 });
aptWalls.push(...box(0.5, 12, 6, 13, C, "concreto"));

const apartamentos: FloorPlan = {
  id: "apartamentos",
  name: "Andar de Apartamentos",
  subtitle: "Pavimento-tipo com 10 unidades",
  width: APT_W,
  depth: APT_D,
  wallHeight: 2.7,
  rooms: aptRooms,
  walls: aptWalls,
  accessPoints: [
    { id: "ap-corr-1", name: "AP Corredor Oeste", x: 15, z: 13.2, y: 2.5, txPower: 20, band: 5 },
    { id: "ap-corr-2", name: "AP Corredor Leste", x: 42, z: 13.2, y: 2.5, txPower: 20, band: 5 },
    { id: "ap-hall", name: "AP Hall Elevadores", x: 27, z: 6, y: 2.5, txPower: 18, band: 2.4 },
  ],
};

export const floorPlans: FloorPlan[] = [
  resort,
  recepcao,
  convencoes,
  piscina,
  apartamentos,
];

export const defaultPlan = floorPlans[1]!;

export function getPlan(id: string): FloorPlan {
  return floorPlans.find((p) => p.id === id) ?? defaultPlan;
}

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
