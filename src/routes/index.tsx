import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";

const Viewer = lazy(() =>
  import("@/components/wifi/Viewer").then((m) => ({ default: m.Viewer })),
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Planta 3D com Mapa de Calor Wi-Fi | SignalPlan" },
      {
        name: "description",
        content:
          "Visualize plantas baixas em 3D com heatmap de sinal Wi-Fi, alcance dos roteadores e velocidade estimada em cada ponto do imóvel.",
      },
      { property: "og:title", content: "Planta 3D com Mapa de Calor Wi-Fi | SignalPlan" },
      {
        property: "og:description",
        content:
          "Simulação 3D de cobertura de rede: RSSI, alcance e velocidade estimada por ambiente.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main>
      <h1 className="sr-only">Visualização 3D de plantas baixas com sinal Wi-Fi</h1>
      <ClientOnly fallback={<div className="viewer-loading">Carregando planta 3D…</div>}>
        <Suspense fallback={<div className="viewer-loading">Carregando planta 3D…</div>}>
          <Viewer />
        </Suspense>
      </ClientOnly>
    </main>
  );
}
