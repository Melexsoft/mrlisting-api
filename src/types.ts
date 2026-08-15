/** Response envelopes. Every endpoint answers in one of these three shapes. */
export interface Envelope<T> {
  resource: T
}

export interface CollectionEnvelope<T> {
  collection: T[]
  pagination?: Pagination | undefined
  filters?: Record<string, string> | undefined
}

export interface Pagination {
  current: number
  previous: number | null
  next: number | null
  per_page: number
  pages: number
  count: number
}

/** A page of results, with its pagination kept alongside rather than flattened away. */
export interface Page<T> {
  items: T[]
  pagination?: Pagination | undefined
  filters?: Record<string, string> | undefined
}

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined | null> | undefined
  body?: unknown
  headers?: Record<string, string>
  /** Overrides the client's user token for this call only. */
  userToken?: string | undefined
  signal?: AbortSignal
}

export interface Transport {
  get<T>(path: string, options?: RequestOptions): Promise<T>
  post<T>(path: string, options?: RequestOptions): Promise<T>
  patch<T>(path: string, options?: RequestOptions): Promise<T>
  put<T>(path: string, options?: RequestOptions): Promise<T>
  delete<T>(path: string, options?: RequestOptions): Promise<T>
}

export interface ClientConfig {
  /**
   * The directory's secret API token.
   *
   * SERVER-SIDE ONLY. It identifies the whole directory, so anything holding it can
   * read everything the directory exposes. Keep it in your backend — a Next.js route
   * handler or server component — and never ship it to a browser bundle.
   */
  apiToken: string

  /** Base URL of the MrListing installation, e.g. https://admin.example.com/api/v1 */
  baseUrl: string

  /** A signed-in frontend user's token, if you have one. */
  userToken?: string

  /** Supply a fetch implementation on runtimes that lack a global one. */
  fetch?: typeof globalThis.fetch

  /** Request timeout in milliseconds. Defaults to 15000. */
  timeout?: number
}

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

export interface CategoryRef {
  slug: string
  name: string
}

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface ListingCard {
  slug: string
  name: string
  short_description: string | null
  city_name: string | null
  listing_type: string | null
  rating_average: string | null
  reviews_count: number
  claimed: boolean
  categories: CategoryRef[]
  coordinates: Coordinates | null
  logo_url: string | null
}

export interface Photo {
  id: number
  thumb_url: string
  card_url: string | null
  hero_url: string | null
}

export interface Seo {
  meta_title: string | null
  meta_description: string | null
  indexable: boolean
}

/**
 * A listing's public profile.
 *
 * Contact fields are `null` until someone claims the entry — an unclaimed entry is
 * fully listed, but its contact details are withheld.
 */
export interface Listing extends ListingCard {
  description: string | null
  email: string | null
  phone: string | null
  website: string | null
  address: string | null
  postal_code: string | null
  banner_url: string | null
  photos: Photo[]
  seo: Seo
}

/** A listing as its owner sees it, including why it may not be visible. */
export interface OwnedListing extends Listing {
  published: boolean
  visible: boolean
  hidden_reason: "unpublished" | "account_suspended" | null
  ranking_score: number
  meta_title: string | null
  meta_description: string | null
  noindex: boolean
}

export interface Category {
  slug: string
  name: string
  description: string | null
  position: number
  listings_count: number
  seo: { meta_title: string | null; meta_description: string | null }
  image_url: string | null
}

export interface City {
  slug: string
  name: string
  postal_code: string | null
  country_iso: string
  listings_count: number
  coordinates: Coordinates | null
}

export interface Site {
  name: string
  slug: string
  locale: string
  timezone: string
  primary_domain: string | null
  seo: Record<string, string>
  forms: Array<{ key: string; name: string; kind: FormKind }>
  counts: { listings: number; categories: number; cities: number }
}

export interface SitemapEntry {
  path: string
  slug: string
  updated_at: string | null
  /** False for a page too thin to index: render it, but add `noindex`. */
  indexable: boolean
}

export interface Sitemap {
  listings: SitemapEntry[]
  categories: SitemapEntry[]
  cities: SitemapEntry[]
  category_city_pairs: SitemapEntry[]
}

export type FormKind = "general" | "direct_inquiry" | "regional_inquiry"

export type FormFieldType = "text" | "textarea" | "email" | "tel" | "select" | "checkbox"

export interface FormField {
  key: string
  label: string
  type: FormFieldType
  required: boolean
  options: string[]
}

export interface Form {
  key: string
  name: string
  kind: FormKind
  success_message: string | null
  /** Render this field hidden and leave it empty; bots fill it in. */
  honeypot_field: string
  fields: FormField[]
}

export interface DirectoryUser {
  name: string | null
  email: string
  role: "user" | "listing_owner"
  listing_owner: boolean
}

export interface Session {
  user: DirectoryUser
  token: string
}

export type ProductAudience = "listing_owners" | "registered_users" | "everyone"

export interface Product {
  id: number
  name: string
  description: string | null
  price_cents: number
  price_formatted: string
  currency: string
  audience: ProductAudience
  billing_mode: "one_time" | "recurring"
  recurring: boolean
}

export interface CheckoutSession {
  checkout_url: string
  purchase_id: number
}

export interface ListingQuery {
  q?: string | undefined
  category?: string | undefined
  city?: string | undefined
  page?: number | undefined
  per_page?: number | undefined
}

export interface PageQuery {
  page?: number | undefined
  per_page?: number | undefined
}

export interface Review {
  rating: number
  title: string | null
  body: string | null
  created_at: string
  /** Falls back to "Anonymous" when the reviewer left no name. */
  author: string
  /** Whether the review came from an invitation the owner sent. */
  verified: boolean
}

export interface ReviewSummary {
  rating_average: number | null
  reviews_count: number
}

/** What a review invitation link resolves to before anyone writes anything. */
export interface ReviewRequestLanding {
  listing: ListingCard
  recipient_name: string | null
  /** False once the link has been used or withdrawn. */
  open: boolean
}

export interface ReviewInput {
  rating: number
  title?: string | undefined
  body?: string | undefined
  author_name?: string | undefined
}

export interface ReviewRequestReceipt {
  email: string
  status: string
}

export type PurchaseStatus = "pending" | "paid" | "failed" | "refunded"

export interface Purchase {
  id: number
  status: PurchaseStatus
  amount_cents: number
  currency: string
  amount_formatted: string
  completed_at: string | null
  created_at: string
  product: {
    id: number
    name: string
    billing_mode: "one_time" | "recurring"
    recurring: boolean
  }
}

export interface ListingType {
  key: string
  name: string
  position: number
}

export type ArticleScope = "blog" | "glossar" | "documentation" | "news"

export interface TagRef {
  slug: string
  name: string
}

/** An article in a list — everything but the content. */
export interface ArticleCard {
  slug: string
  title: string
  excerpt: string | null
  scope: ArticleScope
  tags: TagRef[]
  created_at: string
  updated_at: string
}

/** One article in full. `content` is raw markdown; render and sanitise it yourself. */
export interface Article extends ArticleCard {
  content: string
  images: Array<{ filename: string; url: string | null; thumb_url: string | null }>
}

export interface ArticleQuery extends PageQuery {
  scope?: ArticleScope
  /** A tag's slug, as returned in `tags`. */
  tag?: string
  q?: string
}

/** A form submission aimed at one of the signed-in owner's entries. */
export interface Inquiry {
  id: number
  form_name: string
  listing: { slug: string; name: string }
  sender_name: string
  answers: Array<{ label: string; value: unknown }>
  created_at: string
  /** Set once a conversation grew out of this inquiry. */
  conversation_id: number | null
  /** False when the sender was not signed in — answer that one by email. */
  can_start_conversation: boolean
}

/** A thread between an entry's owner and the person who enquired. */
export interface Conversation {
  id: number
  /** The signed-in user's side of this thread. */
  role: "owner" | "inquirer"
  counterpart: { name: string }
  listing: { slug: string; name: string }
  inquiry: { id: number; form_name: string; created_at: string }
  last_message_at: string | null
  messages_count: number
  /** Messages the other side wrote since the signed-in user last read the thread. */
  unread_count: number
  created_at: string
}

export interface ConversationMessage {
  id: number
  body: string
  sender: { name: string }
  /** True when the signed-in user wrote it. */
  mine: boolean
  created_at: string
}

export type LeadQuestionFieldType = "single_choice" | "multiple_choice" | "free_text" | "boolean"

export interface LeadQuestion {
  key: string
  question: string
  hint: string | null
  field_type: LeadQuestionFieldType
  required: boolean
  position: number
  /** Empty unless the question is a choice question. */
  options: string[]
}

export type LeadAnswerValue = string | string[] | boolean | null

export interface LeadAnswersReceipt {
  saved: string[]
}

export type SubscriptionStatus =
  | "incomplete"
  | "trialing"
  | "active"
  | "past_due"
  | "unpaid"
  | "paused"
  | "canceled"

export interface Subscription {
  id: number
  status: SubscriptionStatus
  /** True once a cancellation is scheduled; access lasts until the period ends. */
  cancel_at_period_end: boolean
  current_period_end: string | null
  canceled_at: string | null
  created_at: string
  product: {
    id: number
    name: string
    price_cents: number
    currency: string
    price_formatted: string
  }
}

export type SchemaCardinality = "one_to_one" | "one_to_many" | "many_to_many"

export type SchemaFieldType =
  | "string"
  | "text"
  | "url"
  | "email"
  | "phone"
  | "number"
  | "date"
  | "boolean"
  | "select"
  | "multi_select"
  | "image"

export interface SchemaField {
  key: string
  label: string
  hint: string | null
  field_type: SchemaFieldType
  required: boolean
  /** Empty unless the field is a choice field. */
  options: string[]
  position: number
}

/** A structured-data schema this directory chose to expose. */
export interface Schema {
  key: string
  name: string
  description: string | null
  cardinality: SchemaCardinality
  position: number
  fields: SchemaField[]
}

/**
 * One answer, in a JSON-friendly spelling per field type: numbers as numbers,
 * dates as ISO strings, multi-selects as arrays, images as URLs.
 */
export type RecordValue = string | number | boolean | string[] | null

export interface ListingRecord {
  id: number
  title: string
  /** Only answered fields appear; the schema is the full field list. */
  values: Record<string, RecordValue>
}

/** One published schema's records on one listing. */
export interface RecordGroup {
  schema: {
    key: string
    name: string
    cardinality: SchemaCardinality
  }
  records: ListingRecord[]
}

export type ListingSearchOperator =
  | "contains"
  | "eq"
  | "gt"
  | "lt"
  | "before"
  | "after"
  | "present"

export interface ListingSearchFilter {
  /** A field key from the schema being searched. */
  field: string
  /** Defaults to "contains". gt/lt compare numbers; before/after compare dates. */
  operator?: ListingSearchOperator | undefined
  value?: string | number | undefined
}

export interface ListingSearchInput {
  /** The published schema to search in — required. */
  schema: string
  /** Free text, matched against record titles and answers. */
  q?: string | undefined
  /** Every filter must hold, each judged on its own record. */
  filters?: ListingSearchFilter[] | undefined
  page?: number | undefined
  per_page?: number | undefined
}
