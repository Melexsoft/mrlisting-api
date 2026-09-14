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

export interface Page<T> {
  items: T[]
  pagination?: Pagination | undefined
  filters?: Record<string, string> | undefined
}

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined | null> | undefined
  body?: unknown
  headers?: Record<string, string>

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

  apiToken: string

  baseUrl: string

  userToken?: string

  fetch?: typeof globalThis.fetch

  timeout?: number
}

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

  tags: TagRef[]
  coordinates: Coordinates | null
  logo_url: string | null

  image_url: string | null
}

export interface TagRef {
  slug: string
  name: string
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

export interface OwnedListing extends Listing {
  published: boolean
  visible: boolean
  hidden_reason: "unpublished" | "account_suspended" | null
  ranking_score: number
  meta_title: string | null
  meta_description: string | null
  noindex: boolean
  contact_full_name: string | null
  tags: TagRef[]
}

/**
 * What an owner may write on their own entry — when registering it through
 * `me.createListing` and when editing it through `me.updateListing`.
 *
 * `published`, the ranking and ownership itself are not in here on purpose:
 * the directory's editors decide those. A self-registered entry is always
 * created unpublished.
 */
export interface OwnerListingInput {
  name?: string
  short_description?: string | null
  description?: string | null
  contact_full_name?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  address?: string | null
  postal_code?: string | null
  city_name?: string | null
  meta_title?: string | null
  meta_description?: string | null
  /** The `key` of an entry type (see `listingTypes.index`). "" clears it, omit to keep it. */
  listing_type?: string | null
  /**
   * Category slugs (see `categories.index`) — ids are never handed out
   * publicly. Replaces the whole set; an empty array clears it, omitting the
   * field keeps the categories as they are. At most 5.
   */
  category_slugs?: string[]
}

export type OwnerListingCreateInput = OwnerListingInput & { name: string }

export interface Category {
  slug: string
  name: string
  description: string | null
  position: number
  listings_count: number
  seo: { meta_title: string | null; meta_description: string | null }

  image_url: string | null

  card_cover_url: string | null
  card_cover_url_2x: string | null
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

  indexable: boolean
}

export interface Sitemap {
  listings: SitemapEntry[]
  categories: SitemapEntry[]
  cities: SitemapEntry[]
  category_city_pairs: SitemapEntry[]
  articles: SitemapEntry[]
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

  honeypot_field: string
  fields: FormField[]
}

export interface DirectoryUser {
  name: string | null
  email: string
  role: "user" | "listing_owner"
  listing_owner: boolean

  active_purchases: string[]
}

export interface Session {
  user: DirectoryUser
  token: string
}

export type ProductAudience = "listing_owners" | "registered_users" | "everyone"

export interface Product {
  id: number

  key: string
  name: string
  description: string | null
  price_cents: number
  price_formatted: string
  currency: string
  audience: ProductAudience
  billing_mode: "one_time" | "recurring"
  recurring: boolean
  stripe_price_id: string | null

  stripe_price?: StripePrice | null
}

export interface StripePrice {
  id: string
  currency: string
  unit_amount: number

  interval: string | null
}

export interface CheckoutSession {
  checkout_url: string
  purchase_id: number
}

export interface ListingQuery {
  q?: string | undefined
  category?: string | undefined
  city?: string | undefined

  tag?: string | undefined
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

  author: string

  verified: boolean
}

export interface ReviewSummary {
  rating_average: number | null
  reviews_count: number
}

export interface ReviewRequestLanding {
  listing: ListingCard
  recipient_name: string | null

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

export interface ArticleCard {
  slug: string
  title: string
  excerpt: string | null
  scope: ArticleScope
  tags: TagRef[]
  created_at: string
  updated_at: string
}

export interface Article extends ArticleCard {
  content: string
  images: Array<{ filename: string; url: string | null; thumb_url: string | null }>
}

export interface ArticleQuery extends PageQuery {
  scope?: ArticleScope

  tag?: string
  q?: string
}

export interface Inquiry {
  id: number
  kind: "general" | "direct_inquiry" | "regional_inquiry"
  form_name: string

  listing: { slug: string; name: string } | null
  sender_name: string
  answers: Array<{ label: string; value: unknown }>
  created_at: string

  conversation_id: number | null

  can_start_conversation: boolean

  locked: boolean
  required_product_key: string | null
}

export interface GuestConversation {
  listing: { slug: string; name: string }
  owner_name: string
  guest_name: string | null
  created_at: string
  messages: GuestMessage[]
}

export interface GuestMessage {
  id: number
  body: string

  mine: boolean
  sender_name: string | null
  created_at: string
}

export interface Conversation {
  id: number

  role: "owner" | "inquirer"
  counterpart: { name: string }
  listing: { slug: string; name: string }
  inquiry: { id: number; form_name: string; created_at: string }
  last_message_at: string | null
  messages_count: number

  unread_count: number
  created_at: string
}

export interface ConversationMessage {
  id: number
  body: string
  sender: { name: string }

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

  options: string[]
}

export type LeadAnswerValue = string | string[] | boolean | null

export interface LeadAnswersReceipt {
  saved: string[]

  submission_id: number

  questions: LeadQuestion[]
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

  searchable: boolean

  options: string[]
  position: number
}

export interface Schema {
  key: string
  name: string
  description: string | null
  cardinality: SchemaCardinality
  position: number
  fields: SchemaField[]
}

export type RecordValue = string | number | boolean | string[] | null

export interface OwnerRecordGroup {
  schema: Schema
  records: ListingRecord[]
}

export interface ListingRecord {
  id: number
  title: string

  values: Record<string, RecordValue>
}

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

  field: string

  operator?: ListingSearchOperator | undefined
  value?: string | number | undefined
}

export interface ListingSearchInput {

  schema: string

  q?: string | undefined

  city?: string | undefined

  category?: string | undefined

  filters?: ListingSearchFilter[] | undefined
  page?: number | undefined
  per_page?: number | undefined
}
