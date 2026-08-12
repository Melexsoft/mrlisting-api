# @mrlisting/api

Connect a directory frontend to the [MrListing](../README.md) API.

No runtime dependencies, TypeScript types included, works in Node 18+, Bun, Deno and edge runtimes.

```bash
npm install @mrlisting/api
```

## Two credentials, and where each belongs

| Credential | Identifies | Lives |
|---|---|---|
| **API token** | the whole directory | **your server only** |
| **User token** | one signed-in visitor | an httpOnly cookie |

> **The API token is a server-side secret.** It identifies the entire directory, so anything holding it can read everything the directory exposes. Keep it in a Next.js route handler, a server component, or your own backend — never in code that reaches a browser. If it ever leaks, rotate it in the dashboard under Settings → API.

## Getting started

```ts
import { mrlisting } from "@mrlisting/api"

const api = mrlisting({
  baseUrl: process.env.MRLISTING_URL!,   // https://admin.example.com/api/v1
  apiToken: process.env.MRLISTING_TOKEN!,
})

const site = await api.site.show()
const { items, pagination } = await api.listings.index({ q: "elmau", page: 1 })
const entry = await api.listings.show("schloss-elmau")
```

Namespaces mirror the API's resources, and the verbs are the API's own: `index`, `show`, `create`, `update`.

## Content

```ts
await api.listings.index({ q, category, city, page, per_page })  // → { items, pagination, filters }
await api.listings.show(slug)
await api.categories.index()
await api.cities.index()
await api.site.show()
await api.site.sitemap()
```

Contact details on a listing are `null` until someone claims the entry. An unclaimed entry is still fully listed — only its email, phone and address are withheld.

### Building a sitemap

Every entry carries an `indexable` flag. A page below the thin-content threshold still gets a link; it just should not be indexed.

```ts
const sitemap = await api.site.sitemap()

export default function sitemapRoutes() {
  return sitemap.listings
    .filter((entry) => entry.indexable)
    .map((entry) => ({ url: `https://example.com${entry.path}`, lastModified: entry.updated_at }))
}
```

## Forms

Render what the directory configured rather than hard-coding a form:

```ts
const form = await api.forms.show("contact")

// form.fields → [{ key, label, type, required, options }]
// form.honeypot_field → render this hidden and leave it empty
```

```ts
await api.forms.submit("contact", {
  data: { name, email, message },
  listingSlug: "schloss-elmau", // optional: makes it an inquiry to that entry's owner
})
```

A `regional_inquiry` form reaches every matching entry owner; a `direct_inquiry` reaches the one it was sent from. Which fields are matched on is the directory's configuration, not yours.

## Signing users in

```ts
const { user, token } = await api.auth.login({ email, password })
// Store `token` in an httpOnly cookie — not localStorage.

const asUser = api.withUser(token)

await asUser.me.show()
await asUser.me.listings()
await asUser.me.updateListing("schloss-elmau", { short_description: "An alpine hotel." })
```

`api.auth.logout(token)` signs the user out **everywhere**: every token they hold stops working, not only the one you present.

An owner may edit their own copy. Publishing, ranking and ownership belong to the directory's editors and are rejected here.

## Claiming an entry

Two routes, both ending in the same place:

```ts
// The tokenised link the directory emailed to the entry's contact address
const { listing, claimed } = await api.claims.show(token)
await api.withUser(userToken).claims.accept(token)

// Or self-claim from the public profile, if the user's email is on the entry's domain
await api.withUser(userToken).listings.claim("schloss-elmau")
```

Free mailbox providers (gmail, gmx, …) are always refused for self-claiming.

## Products

Only present in directories that sell something; others answer `404`.

```ts
const products = await api.withUser(token).products.index()

const { checkout_url } = await api.withUser(token).products.checkout(product.id, {
  successUrl: "https://example.com/thanks",
  cancelUrl: "https://example.com/pricing",
})

redirect(checkout_url)
```

Who may buy is decided server-side: a product meant for entry owners is never listed to a plain visitor. Payment is confirmed by Stripe's webhook to the directory, never by the buyer's return trip — so treat your success page as "thanks", not as "paid".

## Errors

Everything that fails throws an `ApiError`.

```ts
import { ApiError } from "@mrlisting/api"

try {
  await api.listings.show(slug)
} catch (error) {
  if (error instanceof ApiError) {
    if (error.isNotFound) return null
    if (error.isValidationError) return { errors: error.errors }
    if (error.isRateLimited) return { retry: true }
  }
  throw error
}
```

| Property | Meaning |
|---|---|
| `status` | HTTP status; `0` if the request never arrived |
| `errors` | every message the API returned |
| `isUnauthorized` | missing, wrong, or rotated credential |
| `isForbidden` | suspended directory, or wrong audience |
| `isNotFound` / `isValidationError` / `isRateLimited` | 404 / 422 / 429 |

## Next.js

Keep the token on the server and expose only what the page needs:

```ts
// lib/mrlisting.ts
import { mrlisting } from "@mrlisting/api"

export const api = mrlisting({
  baseUrl: process.env.MRLISTING_URL!,
  apiToken: process.env.MRLISTING_TOKEN!, // no NEXT_PUBLIC_ prefix — deliberately
})
```

```ts
// app/eintrag/[slug]/page.tsx
import { api } from "@/lib/mrlisting"

export default async function Page({ params }: { params: { slug: string } }) {
  const listing = await api.listings.show(params.slug)
  return <Profile listing={listing} />
}
```

## Options

```ts
mrlisting({
  baseUrl,          // required
  apiToken,         // required, server-side only
  userToken,        // optional default user; or use api.withUser(token)
  timeout: 15_000,  // ms
  fetch: myFetch,   // for runtimes without a global fetch
})
```

## Development

```bash
npm install
npm test
npm run typecheck
npm run build
```

## License

MIT
