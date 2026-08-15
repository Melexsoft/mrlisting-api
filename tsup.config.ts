import { defineConfig } from "tsup"

export default defineConfig({
  // index = the SDK; mcp = the stdio MCP server bin (ESM-only, node runs it).
  entry: ["src/index.ts", "src/mcp.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  // No runtime dependencies: the client is built on fetch, which every supported
  // runtime provides. Nothing to bundle, nothing for a consumer to dedupe.
  target: "es2022",
  // Makes `require("@mrlisting/api")` return the factory itself rather than
  // an object with a .default on it.
  cjsInterop: true,
})
