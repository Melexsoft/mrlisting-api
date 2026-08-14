import { resource } from "../http.js"
import type {
  CollectionEnvelope, Envelope, Listing, ListingCard, ListingQuery, Page, RecordGroup, Transport,
} from "../types.js"

const path = "listings"

/** Search and browse published entries. */
export async function index(
  transport: Transport,
  query: ListingQuery = {},
): Promise<Page<ListingCard>> {
  const payload = await transport.get<CollectionEnvelope<ListingCard>>(path, {
    query: { ...query },
  })

  return { items: payload.collection, pagination: payload.pagination, filters: payload.filters }
}

/** One entry's public profile. */
export async function show(transport: Transport, slug: string): Promise<Listing> {
  return resource(await transport.get<Envelope<Listing>>(`${path}/${encodeURIComponent(slug)}`))
}

/**
 * Claim an entry from its public profile.
 *
 * Succeeds only when the signed-in user's email is on the entry's own domain; free
 * mailbox providers are always refused.
 */
export async function claim(transport: Transport, slug: string, userToken?: string) {
  return resource(
    await transport.post<Envelope<Listing>>(`${path}/${encodeURIComponent(slug)}/claim`, { userToken }),
  )
}

/**
 * One entry's structured data, grouped by schema — only from schemas the
 * directory published. Render one section per group.
 */
export async function records(transport: Transport, slug: string): Promise<RecordGroup[]> {
  const payload = await transport.get<CollectionEnvelope<RecordGroup>>(
    `${path}/${encodeURIComponent(slug)}/records`,
  )

  return payload.collection
}

export default { index, show, claim, records }
