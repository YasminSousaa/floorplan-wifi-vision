import { box, WALL_ATT } from "../materials";
import type { FloorPlan } from "../types";

/* ------------------------------------------------------------------ */
/* 4. Piscina / área de lazer                                          */
/* ------------------------------------------------------------------ */

const C = WALL_ATT.concreto;
const D = WALL_ATT.drywall;

const POOL_W = 60;
const POOL_D = 40;

export const piscina: FloorPlan = {
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
  surfaces: [
    { kind: "grama", x: 0, z: 0, w: POOL_W, d: POOL_D },
    { kind: "deck", x: 3, z: 3, w: 54, d: 34, r: 6 },
    { kind: "agua", x: 14, z: 6, w: 28, d: 22, r: 7 },
    { kind: "agua", x: 6, z: 24, w: 11, d: 9, r: 4 },
    { kind: "calcada", x: 2, z: 34, w: 18, d: 4, r: 2 },
  ],
  buildings: [
    { x: 43, z: 8, w: 12, d: 9, h: 3.2, roof: "#d9a273" },
    { x: 46, z: 19, w: 11, d: 7, h: 3.2, roof: "#d8c8ab" },
  ],
  trees: [
    { x: 4, z: 5, s: 0.7, kind: "palmeira" },
    { x: 8, z: 9, s: 0.75, kind: "copa" },
    { x: 5, z: 15, s: 0.7, kind: "palmeira" },
    { x: 10, z: 19, s: 0.8, kind: "copa" },
    { x: 54, z: 33, s: 0.7, kind: "palmeira" },
    { x: 47, z: 34, s: 0.75, kind: "palmeira" },
  ],
};
