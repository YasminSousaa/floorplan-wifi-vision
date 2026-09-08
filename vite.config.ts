// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

// The dev-only devtools transform injects `data-tsd-source` attributes into every JSX
// element. react-three-fiber treats dashed props as nested property paths (data.tsd.source)
// and throws on three.js elements. Strip the attribute from the 3D scene files.
function stripDevtoolsSourceIn3D(): Plugin {
  return {
    name: "strip-tsd-source-in-3d",
    enforce: "post",
    apply: "serve",
    transform(code, id) {
      if (!/src[\\/]components[\\/]wifi[\\/].*\.tsx/.test(id)) return null;
      if (!code.includes("data-tsd-source")) return null;
      return {
        code: code.replace(/\s*"data-tsd-source":\s*"[^"]*",?/g, "")
                  .replace(/\s*data-tsd-source=\{?"[^"]*"\}?/g, ""),
        map: null,
      };
    },
  };
}

export default defineConfig({
  plugins: [stripDevtoolsSourceIn3D()],
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
