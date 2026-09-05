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

/** Superfícies de piso desenhadas na planta (grama, água, areia, quadras...) */
export type Surface = {
  kind:
    | "grama"
    | "agua"
    | "mar"
    | "areia"
    | "asfalto"
    | "calcada"
    | "deck"
    | "quadra-azul"
    | "quadra-verde"
    | "telhado";
  x: number;
  z: number;
  w: number;
  d: number;
  /** raio de arredondamento em metros (0 = retângulo) */
  r?: number;
};

export type Tree = { x: number; z: number; s: number; kind: "palmeira" | "copa" };

export type Building = { x: number; z: number; w: number; d: number; h: number; roof?: string };

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
  /** Planta apenas maquete 3D (sem análise de Wi-Fi) */
  modelOnly?: boolean;
  rooms: Room[];
  walls: Wall[];
  accessPoints: AccessPoint[];
  surfaces?: Surface[];
  trees?: Tree[];
  buildings?: Building[];
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

/** Áreas onde não podem nascer árvores (edificações, piscinas, quadras, vias) */
const RESORT_BLOCKED: Array<[number, number, number, number]> = [
  [28, 9, 39, 62],
  [85, 3, 74, 42],
  [171, 3, 66, 42],
  [87, 59, 71, 38],
  [170, 59, 67, 38],
  [104, 108, 61, 39],
  [168, 108, 63, 39],
  [104, 161, 61, 38],
  [168, 161, 63, 38],
  [246, 2, 55, 56],
  [42, 87, 56, 110],
  [97, 204, 103, 83],
  [209, 204, 91, 83],
  [294, 223, 81, 68],
  [302, 4, 55, 68],
  [228, 88, 86, 108],
  [308, 96, 49, 49],
  [308, 163, 58, 27],
  [306, 198, 46, 37],
  [4, 4, 26, 282],
  [13, 200, 71, 87],
  [366, 0, 54, RESORT_D],
  [156, 4, 20, 284],
  [292, 4, 18, 216],
];

function resortTrees(): Tree[] {
  const trees: Tree[] = [];
  let seed = 20240517;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const free = (x: number, z: number) =>
    !RESORT_BLOCKED.some(([bx, bz, bw, bd]) => x > bx - 3 && x < bx + bw + 3 && z > bz - 3 && z < bz + bd + 3);

  // arborização geral dos jardins
  for (let i = 0; i < 900 && trees.length < 260; i++) {
    const x = 6 + rnd() * (366 - 12);
    const z = 6 + rnd() * (RESORT_D - 12);
    if (!free(x, z)) continue;
    trees.push({ x, z, s: 0.75 + rnd() * 0.6, kind: rnd() > 0.55 ? "palmeira" : "copa" });
  }
  // fileira de coqueiros na praia
  for (let z = 8; z < RESORT_D - 6; z += 11) {
    trees.push({ x: 374 + rnd() * 6, z: z + rnd() * 3, s: 1 + rnd() * 0.35, kind: "palmeira" });
  }
  // coqueiros ao redor da piscina
  const poolRing: Array<[number, number]> = [
    [231, 96], [236, 154], [252, 88], [288, 92], [300, 108], [302, 140],
    [292, 176], [262, 186], [240, 178], [226, 168], [222, 128], [226, 110],
  ];
  poolRing.forEach(([x, z]) => trees.push({ x, z, s: 1.05, kind: "palmeira" }));
  return trees;
}


const resort: FloorPlan = {
  id: "resort",
  name: "Resort · Vista Geral",
  subtitle: "Costa Serena Resort & Spa — 18 ha · 320 apartamentos",
  width: RESORT_W,
  depth: RESORT_D,
  wallHeight: 9,
  outdoor: true,
  rooms: [
    // Noroeste — serviço
    { name: "Área de Serviço", x: 32, z: 13, w: 31, d: 24 },
    { name: "Depósitos e Apoio", x: 32, z: 38, w: 31, d: 16 },
    { name: "Oficina", x: 32, z: 55, w: 31, d: 12 },
    // Blocos de hospedagem (8 blocos · 40 aptos cada)
    { name: "Bloco 01", x: 89, z: 7, w: 66, d: 34 },
    { name: "Bloco 02", x: 175, z: 7, w: 58, d: 34 },
    { name: "Bloco 03", x: 91, z: 63, w: 63, d: 30 },
    { name: "Bloco 04", x: 174, z: 63, w: 59, d: 30 },
    { name: "Bloco 05", x: 108, z: 112, w: 53, d: 31 },
    { name: "Bloco 06", x: 172, z: 112, w: 55, d: 31 },
    { name: "Bloco 07", x: 108, z: 165, w: 53, d: 30 },
    { name: "Bloco 08", x: 172, z: 165, w: 55, d: 30 },
    // Lazer e esportes
    { name: "Área de Lazer / Salão de Jogos", x: 250, z: 6, w: 47, d: 48 },
    { name: "Quadra Poliesportiva", x: 306, z: 7, w: 47, d: 38 },
    { name: "Quadra de Tênis", x: 306, z: 50, w: 47, d: 19 },
    // Recepção
    { name: "Administração", x: 46, z: 91, w: 40, d: 22 },
    { name: "Concierge", x: 46, z: 114, w: 40, d: 16 },
    { name: "Recepção", x: 50, z: 131, w: 44, d: 22 },
    { name: "Lobby Principal", x: 50, z: 154, w: 40, d: 24 },
    { name: "Área de Espera", x: 62, z: 179, w: 30, d: 14 },
    // Piscinas
    { name: "Piscina Adulto", x: 239, z: 99, w: 51, d: 53 },
    { name: "Piscina Infantil", x: 229, z: 147, w: 18, d: 20 },
    { name: "Deck da Piscina", x: 262, z: 152, w: 43, d: 34 },
    // Alimentação
    { name: "Restaurante ao Ar Livre", x: 313, z: 100, w: 39, d: 39 },
    { name: "Quiosques e Descanso", x: 316, z: 167, w: 46, d: 19 },
    { name: "Restaurante Praia", x: 312, z: 202, w: 36, d: 29 },
    // Sul — eventos e apoio
    { name: "Estacionamento (280 vagas)", x: 17, z: 204, w: 63, d: 79 },
    { name: "Centro de Convenções", x: 101, z: 208, w: 95, d: 75 },
    { name: "Centro de Eventos", x: 213, z: 208, w: 83, d: 75 },
    { name: "Cozinha Industrial", x: 298, z: 227, w: 34, d: 32 },
    { name: "Refeitório Funcionários", x: 333, z: 227, w: 38, d: 22 },
    { name: "Área Técnica / Manutenção", x: 333, z: 250, w: 38, d: 37 },
    // Leste
    { name: "Praia Privativa", x: 372, z: 10, w: 46, d: 270 },
  ],
  walls: [],
  accessPoints: [],
  modelOnly: true,
  buildings: [
    // serviço (noroeste)
    { x: 32, z: 13, w: 31, d: 54, h: 7, roof: "#cbb79a" },
    // blocos de hospedagem
    { x: 89, z: 7, w: 66, d: 34, h: 15, roof: "#e2cfae" },
    { x: 175, z: 7, w: 58, d: 34, h: 15, roof: "#e2cfae" },
    { x: 91, z: 63, w: 63, d: 30, h: 15, roof: "#e2cfae" },
    { x: 174, z: 63, w: 59, d: 30, h: 15, roof: "#e2cfae" },
    { x: 108, z: 112, w: 53, d: 31, h: 15, roof: "#e2cfae" },
    { x: 172, z: 112, w: 55, d: 31, h: 15, roof: "#e2cfae" },
    { x: 108, z: 165, w: 53, d: 30, h: 15, roof: "#e2cfae" },
    { x: 172, z: 165, w: 55, d: 30, h: 15, roof: "#e2cfae" },
    // área de lazer / salão de jogos
    { x: 250, z: 6, w: 47, d: 48, h: 9, roof: "#d9c7a8" },
    // recepção / lobby
    { x: 46, z: 91, w: 48, d: 102, h: 9, roof: "#efdcba" },
    // eventos
    { x: 101, z: 208, w: 95, d: 75, h: 11, roof: "#cfc6de" },
    { x: 213, z: 208, w: 83, d: 75, h: 11, roof: "#cfc6de" },
    // serviços de apoio (cozinha, refeitório, manutenção)
    { x: 298, z: 227, w: 73, d: 60, h: 8, roof: "#c3d1de" },
    // restaurantes
    { x: 313, z: 100, w: 39, d: 39, h: 5, roof: "#d9a273" },
    { x: 312, z: 202, w: 36, d: 29, h: 5, roof: "#d9a273" },
  ],
  surfaces: [
    // base
    { kind: "grama", x: 0, z: 0, w: 372, d: RESORT_D },
    { kind: "areia", x: 366, z: 0, w: 34, d: RESORT_D },
    { kind: "mar", x: 398, z: 0, w: 22, d: RESORT_D },
    // via de acesso e estacionamento
    { kind: "asfalto", x: 8, z: 8, w: 18, d: 274 },
    { kind: "asfalto", x: 17, z: 204, w: 63, d: 79 },
    { kind: "asfalto", x: 24, z: 118, w: 26, d: 20, r: 8 },
    // circulações internas
    { kind: "calcada", x: 84, z: 44, w: 210, d: 12 },
    { kind: "calcada", x: 84, z: 96, w: 210, d: 12 },
    { kind: "calcada", x: 84, z: 146, w: 140, d: 12 },
    { kind: "calcada", x: 84, z: 196, w: 220, d: 10 },
    { kind: "calcada", x: 160, z: 8, w: 12, d: 280 },
    { kind: "calcada", x: 296, z: 8, w: 10, d: 210 },
    // quadras
    { kind: "quadra-azul", x: 306, z: 7, w: 47, d: 38 },
    { kind: "quadra-verde", x: 306, z: 50, w: 47, d: 19 },
    // piscinas e deck
    { kind: "deck", x: 232, z: 92, w: 78, d: 100, r: 22 },
    { kind: "agua", x: 240, z: 100, w: 50, d: 52, r: 20 },
    { kind: "agua", x: 229, z: 147, w: 18, d: 19, r: 9 },
    // quiosques / descanso
    { kind: "deck", x: 316, z: 167, w: 46, d: 19, r: 6 },
    { kind: "deck", x: 312, z: 202, w: 36, d: 29, r: 4 },
    { kind: "deck", x: 313, z: 100, w: 39, d: 39, r: 4 },
  ],
  trees: resortTrees(),
};

/* ------------------------------------------------------------------ */
/* 2. Recepção / Lobby                                                 */
/* ------------------------------------------------------------------ */

const REC_W = 40;
const REC_D = 26;

const recepcao: FloorPlan = {
  id: "recepcao",
  name: "Lobby e Recepção Principal",
  subtitle: "Planta técnica 1:200 — pavimento térreo",
  width: REC_W,
  depth: REC_D,
  wallHeight: 3.4,
  rooms: [
    { name: "Administração", x: 0.4, z: 4.3, w: 4.4, d: 2.5 },
    { name: "Administração", x: 0.4, z: 7.7, w: 4.4, d: 2.5 },
    { name: "Recepção", x: 5, z: 3.6, w: 10.8, d: 6.2 },
    { name: "Foyer e Lounge", x: 5, z: 10.7, w: 8.3, d: 4.2 },
    { name: "Área de Poltronas", x: 0.6, z: 15.8, w: 11, d: 6.4 },
    { name: "Área de Espera: Sofás", x: 12, z: 16.6, w: 5, d: 5.6 },
    { name: "Concierge / Informações", x: 19.2, z: 6.2, w: 5, d: 3.6 },
    { name: "Banheiros", x: 27, z: 0.6, w: 6.3, d: 4.1 },
    { name: "Elevadores", x: 26.7, z: 5.9, w: 6.6, d: 2.6 },
    { name: "Circulação Principal de Hóspedes", x: 19.2, z: 10.7, w: 17, d: 3.2 },
    { name: "Elevadores", x: 26.7, z: 14.3, w: 7.9, d: 3.7 },
    { name: "Escada", x: 34.8, z: 5.9, w: 3.6, d: 4.5 },
    { name: "Escada", x: 34.8, z: 14.3, w: 3.6, d: 4.5 },
    { name: "Banheiros", x: 25.8, z: 19.3, w: 13.4, d: 4.5 },
  ],
  walls: [
    // envoltória em L (bloco norte recuado à esquerda)
    { x1: 5.6, z1: 2.8, x2: 39.6, z2: 2.8, att: C, kind: "concreto" },
    { x1: 39.6, z1: 2.8, x2: 39.6, z2: 24.2, att: C, kind: "concreto" },
    { x1: 39.6, z1: 24.2, x2: 25.4, z2: 24.2, att: C, kind: "concreto" },
    { x1: 25.4, z1: 24.2, x2: 25.4, z2: 23, att: C, kind: "concreto" },
    { x1: 25.4, z1: 23, x2: 11.8, z2: 23, att: C, kind: "concreto" },
    { x1: 11.8, z1: 23, x2: 11.8, z2: 22.6, att: C, kind: "concreto" },
    { x1: 11.8, z1: 22.6, x2: 0.2, z2: 22.6, att: C, kind: "concreto" },
    { x1: 0.2, z1: 22.6, x2: 0.2, z2: 4, att: C, kind: "concreto" },
    { x1: 0.2, z1: 4, x2: 5.6, z2: 4, att: C, kind: "concreto" },
    { x1: 5.6, z1: 4, x2: 5.6, z2: 2.8, att: C, kind: "concreto" },
    // administração
    ...box(0.2, 4.2, 4.6, 6.2, D, "drywall"),
    { x1: 0.2, z1: 7.2, x2: 4.8, z2: 7.2, att: D, kind: "drywall" },
    // concierge
    ...box(19, 5.6, 5.4, 4.6, D, "drywall"),
    // banheiros norte
    ...box(26.6, 2.8, 7, 4.6, C, "concreto"),
    // núcleos de elevadores
    ...box(26.6, 5.6, 7, 3.2, C, "concreto"),
    ...box(26.6, 14, 8.2, 4.2, C, "concreto"),
    // escadas
    ...box(34.8, 5.6, 3.8, 4.8, C, "concreto"),
    ...box(34.8, 14, 3.8, 4.8, C, "concreto"),
    // banheiros sul
    ...box(25.6, 19, 14, 5.2, C, "concreto"),
    { x1: 30, z1: 19, x2: 30, z2: 24.2, att: D, kind: "drywall" },
    { x1: 34, z1: 19, x2: 34, z2: 24.2, att: D, kind: "drywall" },
    // divisórias leves do lounge
    { x1: 13.6, z1: 10.4, x2: 13.6, z2: 16.4, att: D, kind: "drywall" },
    { x1: 11.8, z1: 16.4, x2: 17.4, z2: 16.4, att: D, kind: "drywall" },
    { x1: 17.6, z1: 14.4, x2: 24.4, z2: 14.4, att: G, kind: "vidro" },
  ],
  accessPoints: [
    { id: "rc1", name: "AP Recepção", x: 10, z: 6.5, y: 3.1, txPower: 22, band: 5 },
    { id: "rc2", name: "AP Foyer / Lounge", x: 9, z: 13.5, y: 3.1, txPower: 22, band: 5 },
    { id: "rc3", name: "AP Poltronas", x: 6, z: 19, y: 2.8, txPower: 18, band: 2.4 },
    { id: "rc4", name: "AP Circulação Hóspedes", x: 24, z: 12.2, y: 3.1, txPower: 22, band: 5 },
    { id: "rc5", name: "AP Elevadores", x: 30, z: 16, y: 2.8, txPower: 18, band: 5 },
  ],
};

/* ------------------------------------------------------------------ */
/* 3. Centro de convenções                                             */
/* ------------------------------------------------------------------ */

const CONV_W = 56;
const CONV_D = 30;

const convencoes: FloorPlan = {
  id: "convencoes",
  name: "Centro de Convenções",
  subtitle: "Planta baixa detalhada 1:200",
  width: CONV_W,
  depth: CONV_D,
  wallHeight: 5.5,
  rooms: [
    { name: "Banheiros Femininos", x: 0.7, z: 2.3, w: 5.8, d: 6 },
    { name: "Banheiros Femininos", x: 0.5, z: 20.2, w: 6, d: 8.8 },
    { name: "Banheiro Acessível", x: 7, z: 20.2, w: 5.7, d: 4.1 },
    { name: "Salas de Reuniões", x: 7, z: 24.8, w: 5.7, d: 4.2 },
    { name: "Recepção / Check-in", x: 4.2, z: 12.9, w: 6, d: 3.6 },
    { name: "Foyer Amplo", x: 10.4, z: 2.3, w: 8.8, d: 14.7 },
    { name: "Salão Principal para Eventos", x: 20.1, z: 0.6, w: 14, d: 14.9 },
    { name: "Área de Apresentação", x: 35, z: 1.8, w: 8, d: 13.7 },
    { name: "Palco", x: 35.6, z: 0.5, w: 7.4, d: 1.3 },
    { name: "Auditório", x: 44.8, z: 2.2, w: 10.7, d: 10.2 },
    { name: "Stage", x: 46.5, z: 0.8, w: 7.5, d: 1.4 },
    { name: "Copa / Área de Apoio", x: 44.8, z: 13.2, w: 7.2, d: 2.8 },
    { name: "Depósito", x: 52, z: 16, w: 3.7, d: 4.2 },
    { name: "Área Administrativa", x: 22.1, z: 16.5, w: 12, d: 4.2 },
    { name: "Sala de Organização de Eventos", x: 36, z: 16.5, w: 7.5, d: 4.2 },
    { name: "Corredores de Circulação", x: 19.2, z: 21.2, w: 24.4, d: 1.6 },
    { name: "Sala 1", x: 20.7, z: 23.1, w: 4.2, d: 5.8 },
    { name: "Sala 2", x: 25.6, z: 23.1, w: 3.7, d: 5.8 },
    { name: "Sala 3", x: 30.1, z: 23.1, w: 4.2, d: 5.8 },
    { name: "Workshop A", x: 35.1, z: 23.1, w: 4.2, d: 5.8 },
    { name: "Workshop B", x: 40, z: 23.1, w: 3.5, d: 5.8 },
    { name: "Entrada Principal", x: 0.6, z: 13, w: 3, d: 3.4 },
  ],
  walls: [
    // envoltória do corpo principal
    ...box(3.6, 0.4, 52.2, 20.2, C, "concreto"),
    // ala oeste (banheiros / recepção)
    ...box(0.4, 2, 6.4, 6.6, C, "concreto"),
    { x1: 0.4, z1: 5, x2: 6.8, z2: 5, att: D, kind: "drywall" },
    ...box(0.4, 19.8, 12.6, 9.4, C, "concreto"),
    { x1: 6.6, z1: 19.8, x2: 6.6, z2: 29.2, att: D, kind: "drywall" },
    { x1: 6.6, z1: 24.4, x2: 13, z2: 24.4, att: D, kind: "drywall" },
    // foyer / salão
    { x1: 19.6, z1: 0.4, x2: 19.6, z2: 20.6, att: C, kind: "concreto" },
    { x1: 10, z1: 0.4, x2: 10, z2: 17.2, att: D, kind: "drywall" },
    { x1: 3.6, z1: 17.2, x2: 19.6, z2: 17.2, att: D, kind: "drywall" },
    // área de apresentação / palco
    { x1: 34.6, z1: 0.4, x2: 34.6, z2: 15.8, att: C, kind: "concreto" },
    { x1: 43.4, z1: 0.4, x2: 43.4, z2: 20.6, att: C, kind: "concreto" },
    { x1: 34.6, z1: 15.8, x2: 43.4, z2: 15.8, att: D, kind: "drywall" },
    // auditório e apoio
    { x1: 44.4, z1: 12.8, x2: 55.8, z2: 12.8, att: C, kind: "concreto" },
    { x1: 51.8, z1: 15.8, x2: 51.8, z2: 20.6, att: D, kind: "drywall" },
    { x1: 44.4, z1: 15.8, x2: 55.8, z2: 15.8, att: D, kind: "drywall" },
    // administração / organização
    ...box(21.8, 16.2, 12.6, 4.4, D, "drywall"),
    ...box(35.8, 16.2, 7.9, 4.4, D, "drywall"),
    // ala sul de salas
    ...box(19.2, 22.8, 25, 6.4, C, "concreto"),
    { x1: 25.2, z1: 22.8, x2: 25.2, z2: 29.2, att: D, kind: "drywall" },
    { x1: 29.6, z1: 22.8, x2: 29.6, z2: 29.2, att: D, kind: "drywall" },
    { x1: 34.6, z1: 22.8, x2: 34.6, z2: 29.2, att: D, kind: "drywall" },
    { x1: 39.6, z1: 22.8, x2: 39.6, z2: 29.2, att: D, kind: "drywall" },
  ],
  accessPoints: [
    { id: "cv1", name: "AP Salão Principal", x: 27, z: 7, y: 5.2, txPower: 24, band: 5 },
    { id: "cv2", name: "AP Área de Apresentação", x: 39, z: 8, y: 5.2, txPower: 24, band: 5 },
    { id: "cv3", name: "AP Auditório", x: 50, z: 7, y: 5.2, txPower: 24, band: 5 },
    { id: "cv4", name: "AP Foyer", x: 14, z: 9, y: 4, txPower: 22, band: 5 },
    { id: "cv5", name: "AP Corredores", x: 31, z: 21.8, y: 3.2, txPower: 20, band: 5 },
    { id: "cv6", name: "AP Salas de Workshop", x: 37, z: 26, y: 2.9, txPower: 18, band: 2.4 },
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
  subtitle: "Piscina adulto, infantil, deck e quiosques",
  width: POOL_W,
  depth: POOL_D,
  wallHeight: 3,
  outdoor: true,
  rooms: [
    { name: "Piscina Adulto", x: 14, z: 6, w: 28, d: 22 },
    { name: "Piscina Infantil", x: 6, z: 24, w: 11, d: 9 },
    { name: "Deck da Piscina", x: 24, z: 26, w: 22, d: 10 },
    { name: "Bar da Piscina", x: 43, z: 8, w: 12, d: 9 },
    { name: "Vestiários", x: 46, z: 19, w: 11, d: 7 },
    { name: "Quiosques e Descanso", x: 30, z: 2, w: 20, d: 4 },
    { name: "Jardins", x: 2, z: 2, w: 10, d: 16 },
    { name: "Acesso ao Deck", x: 2, z: 34, w: 18, d: 4 },
  ],
  walls: [
    ...box(43, 8, 12, 9, D, "drywall"),
    ...box(46, 19, 11, 7, C, "concreto"),
    { x1: 51.5, z1: 19, x2: 51.5, z2: 26, att: D, kind: "drywall" },
  ],
  accessPoints: [
    { id: "ps1", name: "AP Deck Norte", x: 26, z: 8, y: 3.5, txPower: 22, band: 5 },
    { id: "ps2", name: "AP Deck Sul", x: 32, z: 30, y: 3.5, txPower: 22, band: 2.4 },
    { id: "ps3", name: "AP Bar da Piscina", x: 48, z: 12, y: 2.8, txPower: 18, band: 5 },
    { id: "ps4", name: "AP Vestiários", x: 51, z: 22, y: 2.6, txPower: 16, band: 2.4 },
  ],
};

/* ------------------------------------------------------------------ */
/* 5. Andar de apartamentos (pavimento-tipo, 14 unidades)              */
/* ------------------------------------------------------------------ */

const APT_W = 60;
const APT_D = 28;

const aptRooms: Room[] = [];
const aptWalls: Wall[] = [];

// fileira norte: 9 unidades + sacadas
const topLabels = [
  "301-307",
  "301-305",
  "301-306",
  "301-309",
  "301-308",
  "305-319",
  "308-312",
  "308-315",
  "305-314",
];
const topW = 6.4;
topLabels.forEach((name, i) => {
  const x = 0.6 + i * (topW + 0.2);
  aptRooms.push({ name, x, z: 2.6, w: topW, d: 10.6 });
  aptWalls.push(...box(x, 2.6, topW, 10.6, D, "drywall"));
  aptRooms.push({ name: "Sacada", x: x + 0.6, z: 0.4, w: topW - 1.2, d: 2 });
});
aptWalls.push({ x1: 0.6, z1: 2.6, x2: 58.8, z2: 2.6, att: C, kind: "concreto" });

// corredor central
aptRooms.push({ name: "Corredor de Circulação", x: 3.5, z: 13.6, w: 52, d: 2.4 });
aptWalls.push(
  { x1: 0.4, z1: 13.4, x2: 59.6, z2: 13.4, att: D, kind: "drywall" },
  { x1: 0.4, z1: 16, x2: 59.6, z2: 16, att: D, kind: "drywall" },
);

// áreas técnicas nas pontas
aptRooms.push({ name: "Área Técnica", x: 0.4, z: 13.6, w: 3, d: 2.4 });
aptRooms.push({ name: "Área Técnica", x: 56.6, z: 13.6, w: 3, d: 2.4 });

// fileira sul: 2 unidades a oeste do núcleo
const southWest = [
  { name: "308-314", x: 4.5 },
  { name: "301-312", x: 12.5 },
];
southWest.forEach(({ name, x }) => {
  aptRooms.push({ name, x, z: 16.4, w: 7.6, d: 10.4 });
  aptWalls.push(...box(x, 16.4, 7.6, 10.4, D, "drywall"));
});
aptRooms.push({ name: "Área Técnica", x: 0.4, z: 16.4, w: 3.8, d: 10.4 });
aptWalls.push(...box(0.4, 16.4, 3.8, 10.4, C, "concreto"));

// núcleo de circulação vertical
aptRooms.push({ name: "Elevadores", x: 22, z: 16.4, w: 6, d: 5.2 });
aptRooms.push({ name: "Mall do Elevador", x: 28.4, z: 16.4, w: 6.4, d: 5.2 });
aptRooms.push({ name: "Escada de Incêndio", x: 28.4, z: 21.8, w: 6.4, d: 5 });
aptRooms.push({ name: "Área Técnica de Serviço", x: 35.2, z: 16.4, w: 3.6, d: 10.4 });
aptWalls.push(
  ...box(21.6, 16.4, 17.4, 10.4, C, "concreto"),
  { x1: 28.2, z1: 16.4, x2: 28.2, z2: 26.8, att: C, kind: "concreto" },
  { x1: 28.2, z1: 21.6, x2: 34.8, z2: 21.6, att: C, kind: "concreto" },
  { x1: 35, z1: 16.4, x2: 35, z2: 26.8, att: C, kind: "concreto" },
);

// fileira sul: 3 unidades a leste do núcleo
const southEast = [
  { name: "312-318", x: 39.4 },
  { name: "312-320", x: 45.8 },
  { name: "312-322", x: 52.2 },
];
southEast.forEach(({ name, x }) => {
  aptRooms.push({ name, x, z: 16.4, w: 6, d: 10.4 });
  aptWalls.push(...box(x, 16.4, 6, 10.4, D, "drywall"));
});

const apartamentos: FloorPlan = {
  id: "apartamentos",
  name: "Andar de Apartamentos",
  subtitle: "Pavimento-tipo (3º andar) — 14 unidades · ~1.200 m²",
  width: APT_W,
  depth: APT_D,
  wallHeight: 2.7,
  rooms: aptRooms,
  walls: [...box(0, 0, APT_W, APT_D, C, "concreto"), ...aptWalls],
  accessPoints: [
    { id: "ap-corr-1", name: "AP Corredor Oeste", x: 12, z: 14.8, y: 2.5, txPower: 20, band: 5 },
    { id: "ap-corr-2", name: "AP Corredor Centro", x: 30, z: 14.8, y: 2.5, txPower: 20, band: 5 },
    { id: "ap-corr-3", name: "AP Corredor Leste", x: 48, z: 14.8, y: 2.5, txPower: 20, band: 5 },
    { id: "ap-hall", name: "AP Mall do Elevador", x: 31, z: 19, y: 2.5, txPower: 18, band: 2.4 },
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
