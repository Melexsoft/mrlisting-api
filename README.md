# @mrlisting/api

Connect a directory frontend to the MrListing API.

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

Namespaces mirror the API's resources, and the verbs are the API's own: `index`, `show`, `update`, `submit`.

Every call's return value is documented with a realistic example payload in [EXAMPLES.md](./EXAMPLES.md) (shipped inside the package, `node_modules/@mrlisting/api/EXAMPLES.md`) — enough to build and test a frontend against fixtures before a backend exists.

## Content

```ts
await api.listings.index({ q, category, city, page, per_page })  // → { items, pagination, filters }
await api.listings.show(slug)
await api.categories.index()     // → [{ slug, name, listings_count, image_url, card_cover_url, … }]
await api.cities.index()
await api.listingTypes.index()   // → [{ key, name, position }] for labels and type filters
await api.site.show()
await api.site.sitemap()
```

A category carries two independent images. `image_url` is the landscape banner that heads the category's own page. `card_cover_url` is a portrait crop, always exactly 220×274, for grids and tiles where the category is one card among many — because it is a fill crop rather than a fit, every card cover in a grid shares the same aspect ratio and nothing needs letterboxing. `card_cover_url_2x` is the same crop at 440×548 for the `2x` slot of a `srcset`. Each is `null` when nothing was uploaded, and the two are set independently, so handle a banner without a cover and a cover without a banner.

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

## Structured data

Directories can define their own record schemas — shareholders, menu items, opening hours. A schema only appears here after an administrator switched it to "shown on the public API"; everything else stays private.

```ts
const schemas = await api.schemas.index()
// → [{ key, name, description, cardinality, position, fields: [{ key, label, field_type, … }] }]

const groups = await api.listings.records("acme-gmbh")
// → [{ schema: { key, name, cardinality }, records: [{ id, title, values }] }]
```

`values` is keyed by field key and typed per the field — numbers as numbers, dates as ISO strings, multi-selects as arrays, images as URLs. Unanswered fields are absent; use the schema for the full field list.

### Searching by structured data

Find the entries whose records match — "companies with a shareholder over 25%":

```ts
const { items, pagination } = await api.listings.search({
  schema: "shareholders",                                          // required, must be published
  q: "anna",                                                       // optional free text
  filters: [{ field: "share_percent", operator: "gt", value: 25 }],
  city: "berlin",                                                  // optional, by slug
  category: "consulting",                                          // optional, by slug
})

Each schema field carries a `searchable` flag (see `api.schemas.index()`) —
that is the set a search UI should offer as filters.
```

Operators: `contains` (default), `eq`, `gt`, `lt` (numbers), `before`, `after` (dates), `present`. Every filter must hold, each judged on its own record. An unknown field or operator answers `422` instead of silently matching nothing.

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

## Reviews

```ts
const { items, pagination, summary } = await api.listings.reviews("schloss-elmau", { page: 1 })
// summary → { rating_average, reviews_count } for the profile header
```

Reviews are written through invitation links the entry's owner sends. The token in the link is the credential, so no sign-in is needed — and each link works exactly once:

```ts
const landing = await api.reviews.showRequest(token)   // → { listing, recipient_name, open }

if (landing.open) {
  await api.reviews.submitFromRequest(token, { rating: 5, title: "Lovely", body: "Everything was easy." })
}
```

A signed-in owner asks their own customers from your frontend:

```ts
await api.withUser(ownerToken).me.requestReview("schloss-elmau", {
  email: "kunde@example.com",
  name: "Anna",
})
```

The same person cannot be asked again until a cooldown passes; the API answers `422` if it is too soon.

## Lead questions

Directories can configure questions to ask right after signup — what someone is planning, where, when. Render what you are told; the server decides what it accepts:

```ts
const questions = await api.leadQuestions.index()
// → [{ key, question, hint, field_type, required, options, position }]

await api.withUser(token).me.submitLeadAnswers({
  planning: "A wedding",          // single_choice: one of question.options
  regions: ["Berlin", "Potsdam"], // multiple_choice: any of question.options
  budget_known: true,             // boolean
  notes: "Outdoor if possible",   // free_text
})

const answers = await api.withUser(token).me.leadAnswers()
// → { planning: "A wedding", … } — prefill, or skip what is already answered
```

Submissions are all-or-nothing: either every answer is acceptable, or nothing is stored. Answering again overwrites, so re-submitting is safe.

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

## Registering an entry of one's own

A signed-in user who cannot find their entry in the directory adds it themselves:

```ts
const listing = await asUser.me.createListing({
  name: "Schloss Finkenwerder",
  city_name: "Hamburg",
  postal_code: "21129",
  short_description: "A castle by the river.",
  category_slugs: [ "schloss", "trauung-im-freien" ],  // slugs from categories.index()
  listing_type: "venue",                                // key from listingTypes.index()
})

listing.published      // false — always
listing.hidden_reason  // "unpublished"
```

The entry is created **unpublished** and belongs to that user from the first
save. Whether it goes live is the editors' call, so `published` in the input is
ignored — a frontend that wants the editors to know should send its own
notification (a form submission, say) after the call comes back.

`category_slugs` and `listing_type` work the same way on `updateListing`: each
replaces the whole assignment, an empty list clears it, and leaving the field
out keeps what is there.

## An owner's images and extra fields

The signed-in owner manages their entry's images through the API — gallery
photos, the cover (banner) and the logo. Uploads are multipart; pass a `File`
or `Blob` (or a ready-made `FormData`) and the rules are the directory's own:
PNG, JPEG or WEBP, and at most 20 photos.

```ts
const asOwner = api.withUser(token)

await asOwner.me.addListingPhotos("schloss-elmau", [file1, file2]) // appends
await asOwner.me.removeListingPhoto("schloss-elmau", photoId)
await asOwner.me.setListingBanner("schloss-elmau", coverFile)      // replaces
await asOwner.me.removeListingBanner("schloss-elmau")
await asOwner.me.setListingLogo("schloss-elmau", logoFile)
```

Every call answers with the full owner payload, photos included — re-render the
media section without a second request.

Structured data works the same way. The read carries each published schema's
FULL field definition next to the entry's current answers — including schemas
nothing has been answered for yet, so an empty form can be rendered from one
request:

```ts
const groups = await asOwner.me.listingRecords("schloss-elmau")
// → [{ schema: { key, name, cardinality, fields: [...] }, records: [...] }]

await asOwner.me.updateListingRecord("schloss-elmau", "extra_fields", {
  outdoor: true,            // boolean
  budget: "mittel",         // select: one of field.options
  guest_count: 120,         // number
})
```

The write is an upsert for `one_to_one` schemas ("one form per listing");
values are keyed by field key, unknown keys are dropped server-side, and
schemas of any other cardinality answer `422`.

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

// A product your code refers to by name rather than by a numeric id:
const premium = await api.products.byKey("premium_listing")

// resolve: true adds the live Stripe price (or null when Stripe is unreachable):
const withPrice = await api.products.byKey("premium_listing", { resolve: true })
withPrice.stripe_price?.unit_amount // e.g. 9900

const { checkout_url } = await api.withUser(token).products.checkout(product.id, {
  successUrl: "https://example.com/thanks",
  cancelUrl: "https://example.com/pricing",
})

redirect(checkout_url)
```

Who may buy is decided server-side: a product meant for entry owners is never listed to a plain visitor. Payment is confirmed by Stripe's webhook to the directory, never by the buyer's return trip — so on your success page, read the purchase back instead of trusting the redirect:

```ts
const { checkout_url, purchase_id } = await api.withUser(token).products.checkout(product.id, {
  successUrl: "https://example.com/thanks",
})
// Remember purchase_id (session or cookie), then redirect(checkout_url).
// successUrl/cancelUrl must be on the directory's primary domain; anything else
// is replaced with the directory's own default return pages.

// On the success page (server-side):
const purchase = await api.withUser(token).me.purchase(purchase_id)

if (purchase.status === "paid") unlock()
else if (purchase.status === "pending") showProcessing() // the webhook may still be on its way
```

Purchase history, newest first:

```ts
const { items, pagination } = await api.withUser(token).me.purchases({ page: 1 })
// each → { id, status, amount_cents, currency, amount_formatted, completed_at, product }
```

`status` is one of `pending`, `paid`, `failed`, `refunded`. Stripe identifiers never appear in these payloads: your frontend talks to MrListing about payments, never to Stripe.

### Subscriptions

A recurring product's checkout starts a subscription. The directory mirrors its life through Stripe's webhook, and your frontend reads the mirror:

```ts
const { items } = await api.withUser(token).me.subscriptions()
// each → { id, status, cancel_at_period_end, current_period_end, product }

const sub = await api.withUser(token).me.subscription(id)
if (sub.status === "active" || sub.status === "trialing") showMemberArea()
```

Cancelling schedules the stop for the period's end — what was paid for stays available until then:

```ts
const ending = await api.withUser(token).me.cancelSubscription(id)
// ending.cancel_at_period_end === true; status flips to "canceled" via webhook later
```

`status` follows Stripe's vocabulary: `incomplete`, `trialing`, `active`, `past_due`, `unpaid`, `paused`, `canceled`.

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
