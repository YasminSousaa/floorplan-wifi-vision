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

export type Building = {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  roof?: string;
  /** Tipologia arquitetônica — define o formato do telhado. Sem valor = comportamento legado (laje plana). */
  kind?: "guest" | "lobby" | "event" | "dining";
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
  /** Planta apenas maquete 3D (sem análise de Wi-Fi) */
  modelOnly?: boolean;
  rooms: Room[];
  walls: Wall[];
  accessPoints: AccessPoint[];
  surfaces?: Surface[];
  trees?: Tree[];
  buildings?: Building[];
};
