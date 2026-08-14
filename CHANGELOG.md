# Changelog

## 0.2.0

Everything the API already served that the client could not reach.

- Reviews: `listings.reviews(slug)` with pagination and `summary`; invitation flow via `reviews.showRequest(token)` / `reviews.submitFromRequest(token, review)`; owners ask customers with `me.requestReview(slug, { email, name })`
- Purchases become readable: `me.purchases()` and `me.purchase(id)` report the status the directory's Stripe webhook recorded (`pending` / `paid` / `failed` / `refunded`) — success pages can finally tell "thanks" from "paid"
- `listingTypes.index()`: the directory's own kinds of entries, for labels and type filters
- Lead questions: `leadQuestions.index()` and `me.submitLeadAnswers({ key: value })`, all-or-nothing and safe to re-submit
- Subscriptions: `me.subscriptions()`, `me.subscription(id)` and `me.cancelSubscription(id)` — cancellation is scheduled for the period's end, and the status mirrors Stripe's own vocabulary
- Structured data: `schemas.index()` lists the schemas a directory chose to expose, `listings.records(slug)` reads one entry's records grouped by schema, values typed per field
- New types: `Review`, `ReviewSummary`, `ReviewRequestLanding`, `ReviewInput`, `Purchase`, `PurchaseStatus`, `Subscription`, `SubscriptionStatus`, `ListingType`, `LeadQuestion`, `Schema`, `SchemaField`, `RecordGroup`, `PageQuery`
- Fixed: the no-fetch error message named a `createClient` export that does not exist

## 0.1.0

First release.

- Factory client: `mrlisting({ baseUrl, apiToken })`, namespaced by resource
- Content: `site`, `listings`, `categories`, `cities`, `forms`
- Auth for a directory's own frontend users, plus `withUser(token)`
- `me`: profile and owned entries
- Claiming, by tokenised link or from a public profile
- Products and Stripe Checkout, for directories that sell
- Typed `ApiError` with `isUnauthorized` / `isForbidden` / `isNotFound` / `isValidationError` / `isRateLimited`
- No runtime dependencies; ESM and CJS builds with type declarations
