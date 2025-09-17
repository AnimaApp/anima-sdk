import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  build: {
    lib: {
      entry: "./src/index.ts",
      formats: ["cjs", "es"],
      fileName: "index",
    },
    outDir: "./dist",
    emptyOutDir: true,
    target: "es6",
    sourcemap: true,
    rollupOptions: {
      external: ["react", "@animaapp/anima-sdk"],
    },
  },
  plugins: [
    tsconfigPaths(),
    dts({
      rollupTypes: true,
      insertTypesEntry: true,
      include: ["src/**/*"],
      exclude: ["../example-server/**/*", "**/*.stories.*", "**/*.test.*"],
    }),
  ],
});
