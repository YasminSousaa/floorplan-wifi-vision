import { box, WALL_ATT } from "../materials";
import type { FloorPlan } from "../types";

/* ------------------------------------------------------------------ */
/* 3. Centro de convenções                                             */
/* ------------------------------------------------------------------ */

const C = WALL_ATT.concreto;
const D = WALL_ATT.drywall;

const CONV_W = 56;
const CONV_D = 30;

export const convencoes: FloorPlan = {
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
