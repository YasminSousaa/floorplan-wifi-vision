import { box, WALL_ATT } from "../materials";
import type { FloorPlan } from "../types";

/* ------------------------------------------------------------------ */
/* 2. Recepção / Lobby                                                 */
/* ------------------------------------------------------------------ */

const C = WALL_ATT.concreto;
const D = WALL_ATT.drywall;
const G = WALL_ATT.vidro;

const REC_W = 40;
const REC_D = 26;

export const recepcao: FloorPlan = {
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
