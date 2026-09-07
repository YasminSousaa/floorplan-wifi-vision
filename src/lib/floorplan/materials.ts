import type { Wall } from "./types";

/** Atenuação em dB por material de parede, ao atravessar. */
export const WALL_ATT = {
  concreto: 12,
  drywall: 4.5,
  vidro: 2.5,
} as const;

/** Retângulo fechado de paredes */
export function box(
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
