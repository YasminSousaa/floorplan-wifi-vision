// Barrel público do módulo de plantas: mantém a mesma API que existia em
// `src/lib/floorplan.ts` antes da refatoração, agora dividida em:
//   - types.ts          → tipos compartilhados (FloorPlan, Wall, Room, AccessPoint...)
//   - materials.ts       → atenuação por material de parede + helper `box()`
//   - signal-engine.ts   → física do sinal (signalAt, bestSignal, estimateSpeed, quality, signalColor)
//   - plans/*.ts         → uma planta por arquivo
//   - plans/index.ts     → agregação (floorPlans, defaultPlan, getPlan)
export * from "./types";
export * from "./signal-engine";
export * from "./plans";
