# Example responses

Every return value of `@mrlisting/api`, with realistic data. Use this to build a frontend without a live backend: the shapes below are exactly what each call resolves to (the SDK already unwraps the HTTP envelope — you never see `{ resource: ... }` or `{ collection: [...] }`).

Conventions that hold everywhere:

- Timestamps are ISO 8601 strings, e.g. `"2026-08-12T09:24:31.000Z"`.
- Paginated calls resolve to `{ items, pagination }` (plus `filters` on listing queries). `pagination` is absent when the endpoint does not paginate.
- Money is integer cents plus a preformatted string; Stripe identifiers never appear.
- `null` means "not provided", never "empty string".

```jsonc
// Pagination — identical shape on every paginated call
{
  "current": 1,
  "previous": null,
  "next": 2,
  "per_page": 25,
  "pages": 3,
  "count": 62
}
```

## Site

```ts
await api.site.show()
```

```jsonc
{
  "name": "Alpenhotels",
  "slug": "alpenhotels",
  "locale": "de",
  "timezone": "Berlin",
  "primary_domain": "www.alpenhotels.example",
  "seo": { "meta_title": "Alpenhotels – Hotels in den Alpen", "meta_description": "Das Verzeichnis für Hotels in den Alpen." },
  "forms": [
    { "key": "contact", "name": "Kontakt", "kind": "general" },
    { "key": "anfrage", "name": "Direktanfrage", "kind": "direct_inquiry" }
  ],
  "counts": { "listings": 62, "categories": 8, "cities": 14 }
}
```

```ts
await api.site.sitemap()
```

```jsonc
{
  "listings": [
    { "path": "/eintrag/schloss-elmau", "slug": "schloss-elmau", "updated_at": "2026-08-12T09:24:31.000Z", "indexable": true },
    { "path": "/eintrag/pension-alpenblick", "slug": "pension-alpenblick", "updated_at": "2026-07-02T16:40:05.000Z", "indexable": false }
  ],
  "categories": [
    { "path": "/kategorie/wellness", "slug": "wellness", "updated_at": "2026-06-18T08:00:00.000Z", "indexable": true }
  ],
  "cities": [
    { "path": "/stadt/garmisch-partenkirchen", "slug": "garmisch-partenkirchen", "updated_at": "2026-06-18T08:00:00.000Z", "indexable": true }
  ],
  "category_city_pairs": [
    { "path": "/kategorie/wellness/garmisch-partenkirchen", "slug": "wellness/garmisch-partenkirchen", "updated_at": null, "indexable": true }
  ],
  "articles": [
    { "path": "/artikel/die-schoensten-bergseen", "slug": "die-schoensten-bergseen", "updated_at": "2026-08-01T10:41:22.000Z", "indexable": true }
  ]
}
```

## Listings

```ts
await api.listings.index({ city: "garmisch-partenkirchen", page: 1 })
```

```jsonc
{
  "items": [
    {
      "slug": "schloss-elmau",
      "name": "Schloss Elmau",
      "short_description": "Ein alpines Hideaway mit zwei Häusern.",
      "city_name": "Garmisch-Partenkirchen",
      "listing_type": "hotel",
      "rating_average": "4.7",          // string, not number — render as-is
      "reviews_count": 23,
      "claimed": true,
      "categories": [{ "slug": "wellness", "name": "Wellness" }],
      "tags": [{ "slug": "familienfreundlich", "name": "Familienfreundlich" }],
      "coordinates": { "latitude": 47.4632, "longitude": 11.1856 },
      "logo_url": "https://admin.example.com/rails/active_storage/…/logo-card.webp",
      "image_url": "https://admin.example.com/rails/active_storage/…/banner-narrow.webp"
    }
  ],
  "pagination": { "current": 1, "previous": null, "next": null, "per_page": 25, "pages": 1, "count": 1 },
  "filters": { "city": "garmisch-partenkirchen" }   // only the filters that were applied
}
```

```ts
await api.listings.show("schloss-elmau")
```

Everything a card has, plus the profile fields. Contact details are `null` until the entry is claimed:

```jsonc
{
  "slug": "schloss-elmau",
  "name": "Schloss Elmau",
  "short_description": "Ein alpines Hideaway mit zwei Häusern.",
  "city_name": "Garmisch-Partenkirchen",
  "listing_type": "hotel",
  "rating_average": "4.7",
  "reviews_count": 23,
  "claimed": true,
  "categories": [{ "slug": "wellness", "name": "Wellness" }],
  "tags": [{ "slug": "familienfreundlich", "name": "Familienfreundlich" }],
  "coordinates": { "latitude": 47.4632, "longitude": 11.1856 },
  "logo_url": "https://admin.example.com/rails/active_storage/…/logo-card.webp",
  "image_url": "https://admin.example.com/rails/active_storage/…/banner-narrow.webp",
  "description": "Zwischen Wettersteinwand und Ferchensee…",
  "email": "info@schloss-elmau.example",       // null while unclaimed
  "phone": "+49 8823 18-0",                    // null while unclaimed
  "website": "https://www.schloss-elmau.example",
  "address": "In Elmau 2",                     // null while unclaimed
  "postal_code": "82493",
  "banner_url": "https://admin.example.com/rails/active_storage/…/banner-hero.webp",
  "photos": [
    {
      "id": 311,
      "thumb_url": "https://admin.example.com/rails/active_storage/…/photo-thumb.webp",
      "card_url": "https://admin.example.com/rails/active_storage/…/photo-card.webp",
      "hero_url": "https://admin.example.com/rails/active_storage/…/photo-hero.webp"
    }
  ],
  "seo": { "meta_title": "Schloss Elmau – Wellness in Elmau", "meta_description": null, "indexable": true }
}
```

```ts
await api.listings.search({ schema: "shareholders", filters: [{ field: "share_percent", operator: "gt", value: 25 }] })
```

Same `{ items, pagination, filters }` shape as `listings.index`; `filters` echoes the search:

```jsonc
{
  "items": [ /* ListingCard, see above */ ],
  "pagination": { "current": 1, "previous": null, "next": null, "per_page": 25, "pages": 1, "count": 3 },
  "filters": { "schema": "shareholders", "q": null, "city": null, "category": null }
}
```

```ts
await api.listings.records("schloss-elmau")   // published structured data
```

```jsonc
[
  {
    "schema": { "key": "zimmerkategorien", "name": "Zimmerkategorien", "cardinality": "one_to_many" },
    "records": [
      { "id": 87, "title": "Doppelzimmer Bergblick", "values": { "name": "Doppelzimmer Bergblick", "preis_ab": 320, "fruehstueck": true } },
      { "id": 88, "title": "Suite", "values": { "name": "Suite", "preis_ab": 540, "fruehstueck": true } }
    ]
  }
]
```

`values` is keyed by field key and typed per field: numbers as numbers, dates as `"2026-05-01"`, booleans as booleans, multi-selects as arrays of strings, images as URLs. Unanswered fields are absent.

## Categories, cities, listing types

```ts
await api.categories.index()
```

```jsonc
[
  {
    "slug": "wellness",
    "name": "Wellness",
    "description": "Spas, Thermen und Rückzugsorte.",
    "position": 1,
    "listings_count": 17,
    "seo": { "meta_title": null, "meta_description": null },
    "image_url": "https://admin.example.com/rails/active_storage/…/wellness-hero.webp",
    "card_cover_url": "https://admin.example.com/rails/active_storage/…/wellness-card.webp",
    "card_cover_url_2x": "https://admin.example.com/rails/active_storage/…/wellness-card-2x.webp"
  }
]
```

`image_url` is the landscape banner for the category's own page, fitted within
1200×600. `card_cover_url` is a separate portrait upload cropped to exactly
220×274, with `card_cover_url_2x` the same crop at 440×548 — feed them to a
`srcset` and every tile in a category grid lines up without letterboxing. All
three are `null` when the administrator uploaded nothing, and the banner and the
card cover are set independently of each other:

```tsx
<img
  src={category.card_cover_url ?? category.image_url ?? "/placeholder.svg"}
  srcSet={category.card_cover_url_2x ? `${category.card_cover_url} 1x, ${category.card_cover_url_2x} 2x` : undefined}
  width={220}
  height={274}
  alt={category.name}
/>
```

```ts
await api.cities.index()
```

```jsonc
[
  {
    "slug": "garmisch-partenkirchen",
    "name": "Garmisch-Partenkirchen",
    "postal_code": "82467",
    "country_iso": "DE",
    "listings_count": 9,
    "coordinates": { "latitude": 47.4917, "longitude": 11.0955 }
  }
]
```

```ts
await api.listingTypes.index()
```

```jsonc
[
  { "key": "hotel", "name": "Hotel", "position": 1 },
  { "key": "pension", "name": "Pension", "position": 2 }
]
```

## Schemas

```ts
await api.schemas.index()   // only schemas the directory published
```

```jsonc
[
  {
    "key": "zimmerkategorien",
    "name": "Zimmerkategorien",
    "description": "Die buchbaren Zimmertypen eines Hauses.",
    "cardinality": "one_to_many",
    "position": 1,
    "fields": [
      { "key": "name", "label": "Name", "hint": null, "field_type": "string", "required": true, "searchable": true, "options": [], "position": 1 },
      { "key": "preis_ab", "label": "Preis ab (EUR)", "hint": "Pro Nacht", "field_type": "number", "required": false, "searchable": true, "options": [], "position": 2 },
      { "key": "fruehstueck", "label": "Frühstück inklusive", "hint": null, "field_type": "boolean", "required": false, "searchable": false, "options": [], "position": 3 }
    ]
  }
]
```

## Articles

```ts
await api.articles.index({ scope: "blog", page: 1 })
```

```jsonc
{
  "items": [
    {
      "slug": "die-schoensten-bergseen",
      "title": "Die schönsten Bergseen",
      "excerpt": "Sieben Seen, die den Umweg lohnen.",
      "scope": "blog",
      "tags": [{ "slug": "ausflug", "name": "Ausflug" }],
      "created_at": "2026-07-30T06:12:00.000Z",
      "updated_at": "2026-08-01T10:41:22.000Z"
    }
  ],
  "pagination": { "current": 1, "previous": null, "next": null, "per_page": 25, "pages": 1, "count": 1 }
}
```

```ts
await api.articles.show("die-schoensten-bergseen")
```

Adds the full markdown `content` and the images referenced by it:

```jsonc
{
  "slug": "die-schoensten-bergseen",
  "title": "Die schönsten Bergseen",
  "excerpt": "Sieben Seen, die den Umweg lohnen.",
  "scope": "blog",
  "tags": [{ "slug": "ausflug", "name": "Ausflug" }],
  "created_at": "2026-07-30T06:12:00.000Z",
  "updated_at": "2026-08-01T10:41:22.000Z",
  "content": "# Die schönsten Bergseen\n\nDer Ferchensee liegt…",
  "images": [
    { "filename": "ferchensee.webp", "url": "https://admin.example.com/rails/active_storage/…/ferchensee.webp", "thumb_url": "https://admin.example.com/rails/active_storage/…/ferchensee-thumb.webp" }
  ]
}
```

## Forms

```ts
await api.forms.show("contact")
```

```jsonc
{
  "key": "contact",
  "name": "Kontakt",
  "kind": "general",
  "success_message": "Danke! Wir melden uns.",
  "honeypot_field": "website_url",     // render hidden, leave empty
  "fields": [
    { "key": "name", "label": "Name", "type": "text", "required": true, "options": [] },
    { "key": "email", "label": "E-Mail", "type": "email", "required": true, "options": [] },
    { "key": "thema", "label": "Thema", "type": "select", "required": false, "options": ["Allgemein", "Presse"] },
    { "key": "message", "label": "Nachricht", "type": "textarea", "required": true, "options": [] }
  ]
}
```

```ts
await api.forms.submit("contact", { data: { name, email, message } })
```

```jsonc
{ "message": "Danke! Wir melden uns." }
```

## Reviews

```ts
await api.listings.reviews("schloss-elmau", { page: 1 })
```

```jsonc
{
  "items": [
    {
      "rating": 5,
      "title": "Wunderbar",
      "body": "Alles war unkompliziert.",
      "created_at": "2026-08-02T18:55:10.000Z",
      "author": "Anna K.",
      "verified": true
    }
  ],
  "pagination": { "current": 1, "previous": null, "next": null, "per_page": 25, "pages": 1, "count": 23 },
  "summary": { "rating_average": 4.7, "reviews_count": 23 }   // number here, string on cards
}
```

```ts
await api.reviews.showRequest(token)
```

```jsonc
{
  "listing": { /* ListingCard, see above */ },
  "recipient_name": "Anna",
  "open": true          // false once used or expired — hide the form then
}
```

```ts
await api.reviews.submitFromRequest(token, { rating: 5, title: "Wunderbar", body: "…" })
// → the created Review (same shape as items above)

await api.withUser(ownerToken).me.requestReview("schloss-elmau", { email: "kunde@example.com", name: "Anna" })
```

```jsonc
{ "email": "kunde@example.com", "status": "pending" }   // pending | sent | failed | completed — the mail goes out asynchronously
```

## Lead questions

```ts
await api.leadQuestions.index()
```

```jsonc
[
  { "key": "planning", "question": "Was planen Sie?", "hint": null, "field_type": "single_choice", "required": true, "position": 1, "options": ["Eine Hochzeit", "Eine Tagung", "Urlaub"] },
  { "key": "regions", "question": "Welche Regionen?", "hint": "Mehrfachauswahl möglich", "field_type": "multiple_choice", "required": false, "position": 2, "options": ["Garmisch", "Berchtesgaden"] },
  { "key": "budget_known", "question": "Steht das Budget?", "hint": null, "field_type": "boolean", "required": false, "position": 3, "options": [] },
  { "key": "notes", "question": "Sonst noch etwas?", "hint": null, "field_type": "free_text", "required": false, "position": 4, "options": [] }
]
```

```ts
await api.withUser(token).me.leadAnswers()
```

```jsonc
{ "planning": "Eine Hochzeit", "regions": ["Garmisch"], "budget_known": true }
```

```ts
await api.withUser(token).me.submitLeadAnswers({ planning: "Eine Hochzeit", notes: "Draußen, wenn möglich" })
```

```jsonc
{
  "saved": ["planning", "notes"],
  "submission_id": 512,
  "questions": [ /* LeadQuestion[], see index above */ ]
}
```

## Auth and the signed-in user

```ts
await api.auth.login({ email, password })       // signup returns the same Session shape
```

```jsonc
{
  "user": {
    "name": "Max Berger",
    "email": "max@example.com",
    "role": "listing_owner",              // or "user"
    "listing_owner": true,
    "active_purchases": ["premium_listing"]   // product keys with a live paid purchase/subscription
  },
  "token": "eyJhbGciOiJIUzI1NiJ9.…"       // JWT — store in an httpOnly cookie
}
```

```ts
await api.auth.logout(token)                     // → undefined (204, all tokens revoked)
await api.auth.requestPasswordReset(email)       // → { "message": "…" } (same answer whether or not the email exists)
await api.auth.resetPassword({ reset_password_token, password })  // → DirectoryUser (the `user` shape above)

await api.withUser(token).me.show()              // → DirectoryUser
await api.withUser(token).me.update({ name })    // → DirectoryUser
```

## An owner's listings

```ts
await api.withUser(token).me.listings()
```

An array of `OwnedListing` — the public `Listing` shape plus the owner-only fields:

```jsonc
[
  {
    /* every Listing field, see listings.show above, and additionally: */
    "published": true,
    "visible": true,
    "hidden_reason": null,          // "unpublished" | "account_suspended" when visible is false
    "ranking_score": 82,
    "meta_title": null,
    "meta_description": null,
    "noindex": false,
    "contact_full_name": "Max Berger"
  }
]
```

Every owner write answers with the full updated `OwnedListing`, so one call is enough to re-render:

```ts
await asOwner.me.updateListing(slug, { short_description })   // → OwnedListing
await asOwner.me.addListingPhotos(slug, [file1, file2])       // → OwnedListing (photos included)
await asOwner.me.removeListingPhoto(slug, photoId)            // → OwnedListing
await asOwner.me.setListingBanner(slug, file)                 // → OwnedListing
await asOwner.me.removeListingBanner(slug)                    // → OwnedListing
await asOwner.me.setListingLogo(slug, file)                   // → OwnedListing
await asOwner.me.removeListingLogo(slug)                      // → OwnedListing
```

```ts
await asOwner.me.listingRecords("schloss-elmau")
```

Like the public `listings.records`, but each group carries the schema's FULL field definitions (so empty forms can be rendered), and groups exist even for schemas without answers yet:

```jsonc
[
  {
    "schema": { /* full Schema with fields[], see schemas.index above */ },
    "records": [
      { "id": 87, "title": "Doppelzimmer Bergblick", "values": { "name": "Doppelzimmer Bergblick", "preis_ab": 320, "fruehstueck": true } }
    ]
  },
  {
    "schema": { /* a one_to_one schema nothing was answered for */ },
    "records": []
  }
]
```

```ts
await asOwner.me.updateListingRecord("schloss-elmau", "extra_fields", { outdoor: true, guest_count: 120 })
```

```jsonc
{ "id": 91, "title": "Schloss Elmau", "values": { "outdoor": true, "guest_count": 120 } }
```

## Claims

```ts
await api.claims.show(token)
```

```jsonc
{
  "listing": { /* public Listing, see listings.show */ },
  "claimed": false      // true → the link was already used; show "already claimed"
}
```

```ts
await api.withUser(userToken).claims.accept(token)   // → OwnedListing (the user now owns it)
await api.withUser(userToken).listings.claim(slug)   // self-claim by email domain → Listing
```

## Inquiries and conversations

```ts
await api.withUser(token).me.inquiries({ page: 1 })
```

```jsonc
{
  "items": [
    {
      "id": 204,
      "kind": "direct_inquiry",
      "form_name": "Direktanfrage",
      "listing": { "slug": "schloss-elmau", "name": "Schloss Elmau" },
      "sender_name": "Lena Fischer",
      "answers": [
        { "label": "Name", "value": "Lena Fischer" },
        { "label": "Nachricht", "value": "Ist der 14. Juni noch frei?" }
      ],
      "created_at": "2026-08-19T11:02:44.000Z",
      "conversation_id": null,             // set once a conversation was started
      "can_start_conversation": true,
      "locked": false,                     // true → owner lacks the required product
      "required_product_key": null         // e.g. "premium_listing" when locked
    }
  ],
  "pagination": { "current": 1, "previous": null, "next": null, "per_page": 25, "pages": 1, "count": 1 }
}
```

```ts
await api.withUser(token).me.startConversation(inquiryId, "Gerne! Der 14. Juni ist frei.")
// → the created Conversation (shape below)

await api.withUser(token).me.conversations({ page: 1 })
```

```jsonc
{
  "items": [
    {
      "id": 61,
      "role": "owner",                       // this user's side; "inquirer" for the sender
      "counterpart": { "name": "Lena Fischer" },
      "listing": { "slug": "schloss-elmau", "name": "Schloss Elmau" },
      "inquiry": { "id": 204, "form_name": "Direktanfrage", "created_at": "2026-08-19T11:02:44.000Z" },
      "last_message_at": "2026-08-19T14:30:12.000Z",
      "messages_count": 3,
      "unread_count": 1,
      "created_at": "2026-08-19T12:00:09.000Z"
    }
  ],
  "pagination": { "current": 1, "previous": null, "next": null, "per_page": 25, "pages": 1, "count": 1 }
}
```

```ts
await api.withUser(token).me.conversation(61)              // → one Conversation (shape above)
await api.withUser(token).me.conversationMessages(61)
```

```jsonc
{
  "items": [
    {
      "id": 310,
      "body": "Gerne! Der 14. Juni ist frei.",
      "sender": { "name": "Max Berger" },
      "mine": true,
      "created_at": "2026-08-19T12:00:09.000Z"
    }
  ],
  "pagination": { "current": 1, "previous": null, "next": null, "per_page": 25, "pages": 1, "count": 3 }
}
```

```ts
await api.withUser(token).me.sendConversationMessage(61, "Bis dahin!")
// → the created ConversationMessage (shape above, mine: true)
```

A guest who inquired without an account follows a tokenised mail link:

```ts
await api.guest.conversation(token)
```

```jsonc
{
  "listing": { "slug": "schloss-elmau", "name": "Schloss Elmau" },
  "owner_name": "Max Berger",
  "guest_name": "Lena Fischer",
  "created_at": "2026-08-19T12:00:09.000Z",
  "messages": [
    { "id": 310, "body": "Gerne! Der 14. Juni ist frei.", "mine": false, "sender_name": "Max Berger", "created_at": "2026-08-19T12:00:09.000Z" }
  ]
}
```

```ts
await api.guest.reply(token, "Wunderbar, dann buchen wir.")
// → the created GuestMessage (shape above, mine: true)
```

## Products, purchases, subscriptions

Only in directories that sell something; others answer `404` on every call here.

```ts
await api.withUser(token).products.index()
```

```jsonc
[
  {
    "id": 3,
    "key": "premium_listing",
    "name": "Premium-Eintrag",
    "description": "Hervorgehobene Platzierung und Bildergalerie.",
    "price_cents": 9900,
    "price_formatted": "99,00 €",
    "currency": "EUR",
    "audience": "listing_owners",         // "registered_users" | "everyone"
    "billing_mode": "recurring",          // "one_time" | "recurring"
    "recurring": true,
    "stripe_price_id": null               // only set for admins; null here
  }
]
```

```ts
await api.products.byKey("premium_listing", { resolve: true })
```

Adds the live Stripe price (`null` when Stripe is unreachable — always handle that):

```jsonc
{
  /* Product fields as above, plus: */
  "stripe_price": { "id": "price_…", "currency": "eur", "unit_amount": 9900, "interval": "month" }
}
```

```ts
await api.withUser(token).products.checkout(3, { successUrl, cancelUrl })
```

```jsonc
{
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_live_…",
  "purchase_id": 88        // remember it; read the purchase back on your success page
}
```

```ts
await api.withUser(token).me.purchases({ page: 1 })
```

```jsonc
{
  "items": [
    {
      "id": 88,
      "status": "paid",                    // "pending" | "paid" | "failed" | "refunded"
      "amount_cents": 9900,
      "currency": "EUR",
      "amount_formatted": "99,00 €",
      "completed_at": "2026-08-20T10:15:33.000Z",   // null while pending
      "created_at": "2026-08-20T10:14:02.000Z",
      "product": { "id": 3, "name": "Premium-Eintrag", "billing_mode": "recurring", "recurring": true }
    }
  ],
  "pagination": { "current": 1, "previous": null, "next": null, "per_page": 25, "pages": 1, "count": 1 }
}
```

```ts
await api.withUser(token).me.purchase(88)        // → one Purchase (shape above)
await api.withUser(token).me.subscriptions()
```

```jsonc
{
  "items": [
    {
      "id": 12,
      "status": "active",           // incomplete | trialing | active | past_due | unpaid | paused | canceled
      "cancel_at_period_end": false,
      "current_period_end": "2026-09-20T10:15:33.000Z",
      "canceled_at": null,
      "created_at": "2026-08-20T10:15:33.000Z",
      "product": { "id": 3, "name": "Premium-Eintrag", "price_cents": 9900, "currency": "EUR", "price_formatted": "99,00 €" }
    }
  ],
  "pagination": { "current": 1, "previous": null, "next": null, "per_page": 25, "pages": 1, "count": 1 }
}
```

```ts
await api.withUser(token).me.subscription(12)          // → one Subscription (shape above)
await api.withUser(token).me.cancelSubscription(12)
// → the Subscription with cancel_at_period_end: true; status flips to "canceled" later via webhook
```

## Errors

Every failure throws `ApiError`; the HTTP body behind it is always `{ "errors": [...] }`:

```jsonc
// 401
{ "errors": ["An API token is required."] }
{ "errors": ["That API token is not valid."] }
{ "errors": ["You must be signed in."] }

// 403
{ "errors": ["This directory is suspended."] }
{ "errors": ["You are not allowed to do that."] }

// 404
{ "errors": ["Not found."] }

// 422 — validation messages, one per problem
{ "errors": ["Rating muss zwischen 1 und 5 liegen."] }
```

On the thrown `ApiError`: `status` carries the HTTP code (`0` if the request never arrived), `errors` the messages array, and `message` is `errors[0]`.
