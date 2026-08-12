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
