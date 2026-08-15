import { describe, expect, it, vi } from "vitest"

import { availableTools, createApi, handleMessage, TOOLS } from "../src/mcp.js"

const api = (impl: (path: string, init?: RequestInit) => unknown) =>
  createApi("https://x.test/api/agent/v1", "mrl_agent_k", vi.fn(async (url: unknown, init?: RequestInit) => {
    const body = impl(String(url).replace("https://x.test/api/agent/v1", ""), init)
    return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } })
  }) as unknown as typeof fetch)

describe("tool availability", () => {
  it("filters tools by the key's scopes", () => {
    const names = availableTools(["listings.read"]).map((t) => t.name)

    expect(names).toContain("whoami")
    expect(names).toContain("search_listings")
    expect(names).not.toContain("create_listing")
    expect(names).not.toContain("delete_listing")
    expect(names).not.toContain("list_users")
  })

  it("covers every tool with a scope or marks it free", () => {
    for (const tool of TOOLS) {
      expect(tool.scope === null || tool.scope.includes(".")).toBe(true)
    }
  })
})

describe("JSON-RPC handling", () => {
  it("answers initialize and lists only permitted tools", async () => {
    const a = api(() => ({}))

    const init = await handleMessage({ jsonrpc: "2.0", id: 1, method: "initialize" }, a, [])
    expect(init?.result).toMatchObject({ protocolVersion: expect.any(String) })

    const list = await handleMessage({ jsonrpc: "2.0", id: 2, method: "tools/list" }, a, ["articles.read"])
    const tools = (list?.result as { tools: Array<{ name: string }> }).tools.map((t) => t.name)
    expect(tools).toContain("get_article")
    expect(tools).not.toContain("create_article")
  })

  it("calls a tool and returns the API payload as text content", async () => {
    const a = api((path) => {
      expect(path).toBe("/listings/elmau")
      return { resource: { slug: "elmau", name: "Schloss Elmau" } }
    })

    const reply = await handleMessage(
      { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "get_listing", arguments: { slug: "elmau" } } },
      a, ["listings.read"],
    )

    const content = (reply?.result as { content: Array<{ text: string }> }).content[0]
    expect(content?.text).toContain("Schloss Elmau")
  })

  it("refuses a tool outside the key's scopes", async () => {
    const reply = await handleMessage(
      { jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "delete_listing", arguments: { slug: "x" } } },
      api(() => ({})), ["listings.read"],
    )

    expect(reply?.error).toMatchObject({ code: -32602 })
  })

  it("returns API errors as isError content, not crashes", async () => {
    const failing = createApi("https://x.test", "k", vi.fn(async () =>
      new Response(JSON.stringify({ errors: ["This key does not have the listings.write permission."] }), { status: 403 }),
    ) as unknown as typeof fetch)

    const reply = await handleMessage(
      { jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "whoami", arguments: {} } },
      failing, [],
    )

    const result = reply?.result as { isError: boolean; content: Array<{ text: string }> }
    expect(result.isError).toBe(true)
    expect(result.content[0]?.text).toContain("listings.write")
  })

  it("ignores notifications and rejects unknown methods", async () => {
    const a = api(() => ({}))

    expect(await handleMessage({ jsonrpc: "2.0", method: "notifications/initialized" }, a, [])).toBeNull()

    const reply = await handleMessage({ jsonrpc: "2.0", id: 6, method: "resources/list" }, a, [])
    expect(reply?.error).toMatchObject({ code: -32601 })
  })
})
