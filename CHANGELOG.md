# Changelog

## Unreleased

Articles: the directory's editorial content.

- `articles.index({ scope, tag, q, page, per_page })`: published articles as cards (no content), filterable by scope (`blog` / `glossar` / `documentation` / `news`), tag slug and free text
- `articles.show(slug)`: one article in full — raw markdown `content` (render and sanitise it yourself), tags, and its image collection with `url`/`thumb_url`
- New types: `Article`, `ArticleCard`, `ArticleScope`, `ArticleQuery`, `TagRef`

Conversations: in-app messaging between an entry's owner and the person who enquired.

- `me.inquiries()`: the inquiries an owner received for their entries, with `can_start_conversation` telling which can be answered in-app (the sender was signed in) and which only by email
- `me.startConversation(inquiryId, body)`: answer an inquiry — opens the conversation growing out of it, or reuses the existing one, and posts the message in one step
- `me.conversations()` / `me.conversation(id)`: the signed-in user's threads with role, counterpart, listing, originating inquiry and `unread_count`
- `me.conversationMessages(id)`: the thread oldest-first; reading it moves the user's read marker
- `me.sendConversationMessage(id, body)`: write a reply; the counterpart is notified by email, the sender never is
- New types: `Inquiry`, `Conversation`, `ConversationMessage`

## 0.2.0

Everything the API already served that the client could not reach.

- Reviews: `listings.reviews(slug)` with pagination and `summary`; invitation flow via `reviews.showRequest(token)` / `reviews.submitFromRequest(token, review)`; owners ask customers with `me.requestReview(slug, { email, name })`
- Purchases become readable: `me.purchases()` and `me.purchase(id)` report the status the directory's Stripe webhook recorded (`pending` / `paid` / `failed` / `refunded`) — success pages can finally tell "thanks" from "paid"
- `listingTypes.index()`: the directory's own kinds of entries, for labels and type filters
- Lead questions: `leadQuestions.index()` and `me.submitLeadAnswers({ key: value })`, all-or-nothing and safe to re-submit
- Subscriptions: `me.subscriptions()`, `me.subscription(id)` and `me.cancelSubscription(id)` — cancellation is scheduled for the period's end, and the status mirrors Stripe's own vocabulary
- Structured data: `schemas.index()` lists the schemas a directory chose to expose, `listings.records(slug)` reads one entry's records grouped by schema, values typed per field
- Structured-data search: `listings.search({ schema, q, filters })` finds the entries whose records match, with typed operators (`contains`/`eq`/`gt`/`lt`/`before`/`after`/`present`)
- `me.leadAnswers()` reads back what the user answered, for prefilling
- Every list endpoint now carries the same `pagination` envelope; the small reference collections stay whole by default and page the moment `page`/`per_page` is sent
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
