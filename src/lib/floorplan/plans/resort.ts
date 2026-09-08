import type { FloorPlan, Tree } from "../types";

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
    !RESORT_BLOCKED.some(
      ([bx, bz, bw, bd]) => x > bx - 3 && x < bx + bw + 3 && z > bz - 3 && z < bz + bd + 3,
    );

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
    [231, 96],
    [236, 154],
    [252, 88],
    [288, 92],
    [300, 108],
    [302, 140],
    [292, 176],
    [262, 186],
    [240, 178],
    [226, 168],
    [222, 128],
    [226, 110],
  ];
  poolRing.forEach(([x, z]) => trees.push({ x, z, s: 1.05, kind: "palmeira" }));
  return trees;
}

export const resort: FloorPlan = {
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
    // serviço (noroeste) — sem kind: mantém a laje plana original
    { x: 32, z: 13, w: 31, d: 54, h: 7, roof: "#cbb79a" },
    // blocos de hospedagem — telhado de duas águas
    { x: 89, z: 7, w: 66, d: 34, h: 15, kind: "guest" },
    { x: 175, z: 7, w: 58, d: 34, h: 15, kind: "guest" },
    { x: 91, z: 63, w: 63, d: 30, h: 15, kind: "guest" },
    { x: 174, z: 63, w: 59, d: 30, h: 15, kind: "guest" },
    { x: 108, z: 112, w: 53, d: 31, h: 15, kind: "guest" },
    { x: 172, z: 112, w: 55, d: 31, h: 15, kind: "guest" },
    { x: 108, z: 165, w: 53, d: 30, h: 15, kind: "guest" },
    { x: 172, z: 165, w: 55, d: 30, h: 15, kind: "guest" },
    // área de lazer / salão de jogos — palapa
    { x: 250, z: 6, w: 47, d: 48, h: 9, kind: "dining" },
    // recepção / lobby — laje com parapeito, tom quente
    { x: 46, z: 91, w: 48, d: 102, h: 9, kind: "lobby" },
    // eventos — laje com parapeito, tom frio
    { x: 101, z: 208, w: 95, d: 75, h: 11, kind: "event" },
    { x: 213, z: 208, w: 83, d: 75, h: 11, kind: "event" },
    // serviços de apoio (cozinha, refeitório, manutenção) — sem kind: mantém a laje plana original
    { x: 298, z: 227, w: 73, d: 60, h: 8, roof: "#c3d1de" },
    // restaurantes — palapa
    { x: 313, z: 100, w: 39, d: 39, h: 5, kind: "dining" },
    { x: 312, z: 202, w: 36, d: 29, h: 5, kind: "dining" },
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
