import { box, WALL_ATT } from "../materials";
import type { FloorPlan, Room, Wall } from "../types";

/* ------------------------------------------------------------------ */
/* 5. Andar de apartamentos (pavimento-tipo, 14 unidades)              */
/* ------------------------------------------------------------------ */

const C = WALL_ATT.concreto;
const D = WALL_ATT.drywall;

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

export const apartamentos: FloorPlan = {
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
