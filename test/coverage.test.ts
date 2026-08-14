import { describe, expect, it } from "vitest"

import { mrlisting } from "../src/index.js"
import { client, failure, stubFetch } from "./helpers.js"

describe("content", () => {
  it("fetches the sitemap", async () => {
    const { api, calls } = client([
      { body: { resource: { listings: [ { path: "/eintrag/a", indexable: true } ],
        categories: [], cities: [], category_city_pairs: [] } } },
    ])

    const sitemap = await api.site.sitemap()

    expect(calls[0]?.url).toContain("/sitemap")
    expect(sitemap.listings[0]?.indexable).toBe(true)
  })

  it("lists cities", async () => {
    const { api, calls } = client([
      { body: { collection: [ { slug: "berlin", name: "Berlin", listings_count: 3 } ] } },
    ])

    const cities = await api.cities.index()

    expect(calls[0]?.url).toContain("/cities")
    expect(cities[0]?.slug).toBe("berlin")
  })

  it("reads a form's field definitions", async () => {
    const { api, calls } = client([
      { body: { resource: { key: "contact", honeypot_field: "company_website", fields: [] } } },
    ])

    const form = await api.forms.show("contact")

    expect(calls[0]?.url).toContain("forms/contact")
    expect(form.honeypot_field).toBe("company_website")
  })

  it("keeps the base URL's own path when it lacks a trailing slash", async () => {
    const { fetchMock, calls } = stubFetch([ { body: { collection: [] } } ])
    const api = mrlisting({
      baseUrl: "https://admin.example.test/api/v1",
      apiToken: "tok",
      fetch: fetchMock as unknown as typeof fetch,
    })

    await api.categories.index()

    expect(calls[0]?.url).toBe("https://admin.example.test/api/v1/categories")
  })
})

describe("auth", () => {
  it("signs a user up, defaulting the password confirmation", async () => {
    const { api, calls } = client([
      { status: 201, body: { resource: { email: "a@b.de" }, token: "jwt" } },
    ])

    const session = await api.auth.signup({ email: "a@b.de", password: "secret1234" })

    expect(calls[0]?.url).toContain("auth/signup")
    expect(JSON.parse(String(calls[0]?.init.body)).user).toMatchObject({
      email: "a@b.de",
      password: "secret1234",
      password_confirmation: "secret1234",
    })
    expect(session.token).toBe("jwt")
  })

  it("asks for a password reset without leaking whether the address exists", async () => {
    const { api, calls } = client([ { body: { resource: { message: "Check your mail." } } } ])

    const receipt = await api.auth.requestPasswordReset("a@b.de")

    expect(calls[0]?.init.method).toBe("POST")
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({ user: { email: "a@b.de" } })
    expect(receipt.message).toBe("Check your mail.")
  })

  it("resets the password with the emailed token", async () => {
    const { api, calls } = client([ { body: { resource: { email: "a@b.de" } } } ])

    await api.auth.resetPassword({ reset_password_token: "tok", password: "newsecret1" })

    expect(calls[0]?.init.method).toBe("PUT")
    expect(JSON.parse(String(calls[0]?.init.body)).user).toMatchObject({
      reset_password_token: "tok",
      password: "newsecret1",
      password_confirmation: "newsecret1",
    })
  })
})

describe("me", () => {
  it("updates the profile", async () => {
    const { api, calls } = client([ { body: { resource: { name: "Anna" } } } ], "user-jwt")

    const user = await api.me.update({ name: "Anna" })

    expect(calls[0]?.init.method).toBe("PATCH")
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({ user: { name: "Anna" } })
    expect(user.name).toBe("Anna")
  })

  it("edits an owned entry under the listing key", async () => {
    const { api, calls } = client([ { body: { resource: { slug: "cafe-adler" } } } ], "owner-jwt")

    await api.me.updateListing("cafe-adler", { short_description: "Alpine." })

    expect(calls[0]?.url).toContain("me/listings/cafe-adler")
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({
      listing: { short_description: "Alpine." },
    })
  })
})

describe("claiming", () => {
  it("resolves a claim link", async () => {
    const { api, calls } = client([
      { body: { resource: { listing: { slug: "cafe-adler" }, claimed: false } } },
    ])

    const { listing, claimed } = await api.claims.show("tok/en")

    expect(calls[0]?.url).toContain("claims/tok%2Fen")
    expect(listing.slug).toBe("cafe-adler")
    expect(claimed).toBe(false)
  })

  it("accepts a claim link as the signed-in user", async () => {
    const { api, calls } = client([ { body: { resource: { slug: "cafe-adler", claimed: true } } } ], "user-jwt")

    const owned = await api.claims.accept("token123")

    expect(calls[0]?.init.method).toBe("POST")
    expect(calls[0]?.init.headers).toMatchObject({ "X-User-Token": "user-jwt" })
    expect(owned.claimed).toBe(true)
  })

  it("claims from the public profile", async () => {
    const { api, calls } = client([ { body: { resource: { slug: "cafe-adler", claimed: true } } } ], "user-jwt")

    await api.listings.claim("cafe-adler")

    expect(calls[0]?.url).toContain("listings/cafe-adler/claim")
    expect(calls[0]?.init.method).toBe("POST")
  })
})

describe("products", () => {
  it("lists what the directory sells to this caller", async () => {
    const { api, calls } = client(
      [ { body: { collection: [ { id: 3, name: "Featured", recurring: false } ] } } ],
      "user-jwt",
    )

    const products = await api.products.index()

    expect(calls[0]?.url).toContain("/products")
    expect(products[0]?.name).toBe("Featured")
  })

  it("flags the 404 a non-selling directory answers with", async () => {
    const { api } = client([ { status: 404, body: { errors: [ "Not found." ] } } ])

    const error = await failure(api.products.index())

    expect(error.isNotFound).toBe(true)
    expect(error.status).toBe(404)
  })
})
