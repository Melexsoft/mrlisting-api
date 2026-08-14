import { beforeEach, describe, expect, it, vi } from "vitest"

import { ApiError, mrlisting } from "../src/index.js"
import { client, failure, stubFetch } from "./helpers.js"

describe("credentials", () => {
  it("sends the directory token on every request", async () => {
    const { api, calls } = client([ { body: { collection: [] } } ])

    await api.categories.index()

    expect(calls[0]?.init.headers).toMatchObject({ "X-Api-Key": "sk_directory_token" })
  })

  it("sends a user token in its own header, never mixed with the account token", async () => {
    const { api, calls } = client([ { body: { resource: { email: "a@b.de" } } } ], "user-jwt")

    await api.me.show()

    const headers = calls[0]?.init.headers as Record<string, string>
    expect(headers["X-Api-Key"]).toBe("sk_directory_token")
    expect(headers["X-User-Token"]).toBe("user-jwt")
  })

  it("lets a single call override the user", async () => {
    const { api, calls } = client([ { body: { resource: {} } } ], "default-user")

    await api.me.show("someone-else")

    expect((calls[0]?.init.headers as Record<string, string>)["X-User-Token"]).toBe("someone-else")
  })

  it("binds a client to one user with withUser()", async () => {
    const { fetchMock, calls } = stubFetch([ { body: { collection: [] } } ])
    const api = mrlisting({
      baseUrl: "https://admin.example.test/api/v1",
      apiToken: "sk_directory_token",
      fetch: fetchMock as unknown as typeof fetch,
    })

    await api.withUser("bound-token").me.listings()

    expect((calls[0]?.init.headers as Record<string, string>)["X-User-Token"]).toBe("bound-token")
  })

  it("refuses to be constructed without credentials", () => {
    expect(() => mrlisting({ baseUrl: "https://x.test", apiToken: "" })).toThrow(/apiToken/)
    expect(() => mrlisting({ baseUrl: "", apiToken: "t" })).toThrow(/baseUrl/)
  })
})

describe("listings", () => {
  it("returns items and pagination side by side", async () => {
    const { api } = client([
      {
        body: {
          collection: [ { slug: "schloss-elmau", name: "Schloss Elmau" } ],
          pagination: { current: 1, previous: null, next: null, per_page: 25, pages: 1, count: 1 },
          filters: { q: "elmau" },
        },
      },
    ])

    const page = await api.listings.index({ q: "elmau" })

    expect(page.items).toHaveLength(1)
    expect(page.pagination?.count).toBe(1)
    expect(page.filters).toEqual({ q: "elmau" })
  })

  it("puts query parameters on the URL and drops empty ones", async () => {
    const { api, calls } = client([ { body: { collection: [] } } ])

    await api.listings.index({ q: "elmau", category: undefined, page: 2 })

    const url = new URL(calls[0]!.url)
    expect(url.searchParams.get("q")).toBe("elmau")
    expect(url.searchParams.get("page")).toBe("2")
    expect(url.searchParams.has("category")).toBe(false)
  })

  it("unwraps the resource envelope on show", async () => {
    const { api } = client([ { body: { resource: { slug: "schloss-elmau", name: "Schloss Elmau" } } } ])

    const listing = await api.listings.show("schloss-elmau")

    expect(listing.name).toBe("Schloss Elmau")
  })

  it("escapes a slug into the path", async () => {
    const { api, calls } = client([ { body: { resource: {} } } ])

    await api.listings.show("a/b")

    expect(calls[0]?.url).toContain("listings/a%2Fb")
  })
})

describe("errors", () => {
  it("turns a 422 into an ApiError carrying the messages", async () => {
    const { api } = client([ { status: 422, body: { errors: [ "Name is required", "Email is invalid" ] } } ])

    const error = await failure(api.forms.submit("contact", { data: {} }))

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(422)
    expect(error.isValidationError).toBe(true)
    expect(error.errors).toEqual([ "Name is required", "Email is invalid" ])
    expect(error.message).toBe("Name is required")
  })

  it("flags an expired or rotated credential" , async () => {
    const { api } = client([ { status: 401, body: { errors: [ "That API token is not valid." ] } } ])

    const error = await failure(api.site.show())

    expect(error.isUnauthorized).toBe(true)
  })

  it("flags a suspended directory" , async () => {
    const { api } = client([ { status: 403, body: { errors: [ "This directory is suspended." ] } } ])

    const error = await failure(api.site.show())

    expect(error.isForbidden).toBe(true)
  })

  it("flags throttling", async () => {
    const { api } = client([ { status: 429, body: { errors: [ "Too many submissions." ] } } ])

    const error = await failure(api.forms.submit("contact", { data: {} }))

    expect(error.isRateLimited).toBe(true)
  })

  it("survives a gateway answering with HTML instead of JSON", async () => {
    const fetchMock = vi.fn(async () => new Response("<html>502</html>", { status: 502 }))
    const api = mrlisting({
      baseUrl: "https://admin.example.test/api/v1",
      apiToken: "t",
      fetch: fetchMock as unknown as typeof fetch,
    })

    const error = await failure(api.site.show())

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(502)
  })

  it("reports a request that never reached the API", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("getaddrinfo ENOTFOUND")
    })
    const api = mrlisting({
      baseUrl: "https://admin.example.test/api/v1",
      apiToken: "t",
      fetch: fetchMock as unknown as typeof fetch,
    })

    const error = await failure(api.site.show())

    expect(error.status).toBe(0)
    expect(error.message).toMatch(/could not reach/i)
  })
})

describe("auth", () => {
  it("returns the user and token together", async () => {
    const { api, calls } = client([
      { body: { resource: { email: "alex@example.com", role: "user" }, token: "jwt-123" } },
    ])

    const session = await api.auth.login({ email: "alex@example.com", password: "secret1234" })

    expect(session.token).toBe("jwt-123")
    expect(session.user.email).toBe("alex@example.com")
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({
      user: { email: "alex@example.com", password: "secret1234" },
    })
  })

  it("returns nothing from a 204 logout", async () => {
    const { api } = client([ { status: 204 } ])

    await expect(api.auth.logout("jwt")).resolves.toBeUndefined()
  })
})

describe("forms", () => {
  it("attaches an entry when the form was submitted from one", async () => {
    const { api, calls } = client([ { body: { resource: { message: "Thanks" } } } ])

    await api.forms.submit("contact", { data: { name: "Alex" }, listingSlug: "schloss-elmau" })

    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({
      data: { name: "Alex" },
      listing_slug: "schloss-elmau",
    })
  })
})

describe("products", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns the checkout URL to redirect the buyer to", async () => {
    const { api } = client([
      { status: 201, body: { resource: { checkout_url: "https://checkout.stripe.com/x", purchase_id: 7 } } },
    ], "user-jwt")

    const session = await api.products.checkout(3, { successUrl: "https://shop.test/ok" })

    expect(session.checkout_url).toBe("https://checkout.stripe.com/x")
    expect(session.purchase_id).toBe(7)
  })

  it("passes the return URLs through in the API's own naming", async () => {
    const { api, calls } = client([ { status: 201, body: { resource: {} } } ], "user-jwt")

    await api.products.checkout(3, { successUrl: "https://shop.test/ok", cancelUrl: "https://shop.test/no" })

    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({
      success_url: "https://shop.test/ok",
      cancel_url: "https://shop.test/no",
    })
  })
})
