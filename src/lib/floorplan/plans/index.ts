import type { FloorPlan } from "../types";
import { apartamentos } from "./apartamentos";
import { convencoes } from "./convencoes";
import { piscina } from "./piscina";
import { recepcao } from "./recepcao";
import { resort } from "./resort";

export const floorPlans: FloorPlan[] = [resort, recepcao, convencoes, piscina, apartamentos];

export const defaultPlan = floorPlans[1]!;

export function getPlan(id: string): FloorPlan {
  return floorPlans.find((p) => p.id === id) ?? defaultPlan;
}
