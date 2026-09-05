import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo, useState } from "react";
import {
  bestSignal,
  estimateSpeed,
  floorPlans,
  getPlan,
  quality,
  type AccessPoint,
  type FloorPlan,
} from "@/lib/floorplan";
import { Scene } from "./Scene";

const BANDS = [
  { value: 2.4, label: "2.4 GHz" },
  { value: 5, label: "5 GHz" },
  { value: 6, label: "6 GHz" },
];

function roomStats(plan: FloorPlan, aps: AccessPoint[], band: number) {
  return plan.rooms.map((r) => {
    let sum = 0;
    let worst = 0;
    let n = 0;
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        const x = r.x + ((i + 0.5) / 5) * r.w;
        const z = r.z + ((j + 0.5) / 5) * r.d;
        const { dbm } = bestSignal(plan, aps, x, z, band);
        sum += dbm;
        worst = n === 0 ? dbm : Math.min(worst, dbm);
        n++;
      }
    }
    const avg = sum / n;
    return { name: r.name, avg, worst, speed: estimateSpeed(avg, band) };
  });
}

export function Viewer() {
  const [planId, setPlanId] = useState("resort");
  const plan = useMemo(() => getPlan(planId), [planId]);
  const [modeReq, setModeReq] = useState<"3d" | "wifi">("3d");
  const mode: "3d" | "wifi" = plan.modelOnly ? "3d" : modeReq;
  const wifi = mode === "wifi";

  const [band, setBand] = useState<number>(5);
  const [heat, setHeat] = useState(0.85);
  const [walls, setWalls] = useState(0.9);
  const [labels, setLabels] = useState(true);
  const [active, setActive] = useState<string[]>(plan.accessPoints.map((a) => a.id));
  const [selected, setSelected] = useState<string | null>(plan.accessPoints[0]?.id ?? null);
  const [probe, setProbe] = useState<{ x: number; z: number } | null>({
    x: plan.width / 2,
    z: plan.depth / 2,
  });

  const changePlan = (id: string) => {
    const next = getPlan(id);
    setPlanId(id);
    setActive(next.accessPoints.map((a) => a.id));
    setSelected(next.accessPoints[0]?.id ?? null);
    setProbe({ x: next.width / 2, z: next.depth / 2 });
  };

  const aps = useMemo(
    () => plan.accessPoints.filter((a) => active.includes(a.id)),
    [plan, active],
  );
  const stats = useMemo(
    () => (wifi ? roomStats(plan, aps, band) : []),
    [plan, aps, band, wifi],
  );

  const toggleAp = (id: string) =>
    setActive((cur) => (cur.includes(id) ? cur.filter((i) => i !== id) : [...cur, id]));

  const probeInfo = probe ? bestSignal(plan, aps, probe.x, probe.z, band) : null;
  const span = Math.max(plan.width, plan.depth);

  return (
    <div className="viewer-shell">
      <div className="viewer-canvas">
        <Canvas
          key={plan.id}
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, span * 0.85, span * 1.05], fov: 45, far: span * 8 }}
        >
          <Suspense fallback={null}>
            <Scene
              plan={plan}
              mode={mode}
              band={band}
              heatmapOpacity={heat}
              wallOpacity={walls}
              showLabels={labels}
              activeAps={active}
              probe={probe}
              onProbe={setProbe}
              selectedAp={selected}
              onSelectAp={setSelected}
            />
          </Suspense>
        </Canvas>

        <div className="viewer-hint">
          {wifi
            ? "Arraste para orbitar · Scroll para zoom · Clique no piso para medir o sinal"
            : "Arraste para orbitar · Scroll para zoom · Maquete 3D do complexo"}
        </div>

        {wifi && (
        <div className="legend">
          <span className="legend-title">RSSI</span>
          <div className="legend-bar" />
          <div className="legend-scale">
            <span>-95</span>
            <span>-75</span>
            <span>-55</span>
            <span>-35 dBm</span>
          </div>
        </div>
        )}
      </div>

      <aside className="viewer-panel">
        <header className="panel-head">
          <span className="panel-eyebrow">
            {wifi ? "Mapa de calor Wi-Fi" : "Maquete 3D"}
          </span>
          <h1>{plan.name}</h1>
          <p>{plan.subtitle}</p>
        </header>

        <section className="panel-block">
          <h2>Planta</h2>
          <div className="seg seg-wrap">
            {floorPlans.map((p) => (
              <button
                key={p.id}
                onClick={() => changePlan(p.id)}
                className={plan.id === p.id ? "seg-btn seg-btn-on" : "seg-btn"}
              >
                {p.name}
              </button>
            ))}
          </div>
        </section>

        <section className="panel-block">
          <h2>Modo de visualização</h2>
          <div className="seg">
            <button
              onClick={() => setModeReq("3d")}
              className={mode === "3d" ? "seg-btn seg-btn-on" : "seg-btn"}
            >
              Somente 3D
            </button>
            <button
              onClick={() => setModeReq("wifi")}
              disabled={plan.modelOnly}
              className={mode === "wifi" ? "seg-btn seg-btn-on" : "seg-btn"}
            >
              Pontos de acesso
            </button>
          </div>
          {plan.modelOnly && (
            <p className="readout-note">
              A vista geral do resort é apenas maquete 3D. Escolha outra planta para analisar o
              Wi-Fi.
            </p>
          )}
        </section>

        {wifi && (
        <>
        <section className="panel-block">
          <h2>Banda</h2>
          <div className="seg">
            {BANDS.map((b) => (
              <button
                key={b.value}
                onClick={() => setBand(b.value)}
                className={band === b.value ? "seg-btn seg-btn-on" : "seg-btn"}
              >
                {b.label}
              </button>
            ))}
          </div>
        </section>

        <section className="panel-block">
          <h2>Pontos de acesso</h2>
          <ul className="ap-list">
            {plan.accessPoints.map((ap) => {
              const on = active.includes(ap.id);
              return (
                <li key={ap.id}>
                  <button
                    className={selected === ap.id ? "ap-row ap-row-sel" : "ap-row"}
                    onClick={() => setSelected(ap.id)}
                  >
                    <span className={on ? "ap-led ap-led-on" : "ap-led"} />
                    <span className="ap-name">{ap.name}</span>
                    <span className="ap-meta">
                      {ap.txPower} dBm · {ap.band} GHz
                    </span>
                  </button>
                  <button className="ap-toggle" onClick={() => toggleAp(ap.id)}>
                    {on ? "Desligar" : "Ligar"}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="panel-block">
          <h2>Visualização</h2>
          <label className="ctl">
            <span>Intensidade do heatmap</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={heat}
              onChange={(e) => setHeat(Number(e.target.value))}
            />
          </label>
          <label className="ctl">
            <span>Opacidade das paredes</span>
            <input
              type="range"
              min={0.15}
              max={1}
              step={0.05}
              value={walls}
              onChange={(e) => setWalls(Number(e.target.value))}
            />
          </label>
          <label className="ctl ctl-row">
            <span>Nomes dos ambientes</span>
            <input
              type="checkbox"
              checked={labels}
              onChange={(e) => setLabels(e.target.checked)}
            />
          </label>
        </section>

        <section className="panel-block">
          <h2>Ponto medido</h2>
          {probeInfo ? (
            <div className="probe-readout">
              <div className="readout-main">
                <strong>{probeInfo.dbm.toFixed(1)}</strong>
                <span>dBm</span>
              </div>
              <div className="readout-main">
                <strong>{estimateSpeed(probeInfo.dbm, band)}</strong>
                <span>Mbps est.</span>
              </div>
              <div className={`readout-tag tone-${quality(probeInfo.dbm).tone}`}>
                {quality(probeInfo.dbm).label}
              </div>
              <p className="readout-note">
                Melhor AP: {probeInfo.ap?.name ?? "nenhum"} · posição {probe!.x.toFixed(1)} m,{" "}
                {probe!.z.toFixed(1)} m
              </p>
            </div>
          ) : (
            <p className="readout-note">Clique no piso para medir.</p>
          )}
        </section>

        <section className="panel-block">
          <h2>Cobertura por ambiente</h2>
          <table className="cov-table">
            <thead>
              <tr>
                <th>Ambiente</th>
                <th>Médio</th>
                <th>Pior</th>
                <th>Mbps</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.name}>
                  <td>{s.name}</td>
                  <td className={`tone-text-${quality(s.avg).tone}`}>{s.avg.toFixed(0)}</td>
                  <td className={`tone-text-${quality(s.worst).tone}`}>{s.worst.toFixed(0)}</td>
                  <td>{s.speed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        </>
        )}
      </aside>
    </div>
  );
}
