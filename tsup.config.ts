import { defineConfig } from "tsup"

export default defineConfig({

  entry: ["src/index.ts", "src/mcp.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,

  target: "es2022",

  cjsInterop: true,
})
