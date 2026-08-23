import { resource } from "../http.js"
import type {
  CollectionEnvelope, Envelope, Listing, ListingCard, ListingQuery, ListingSearchInput,
  Page, RecordGroup, Transport,
} from "../types.js"

const path = "listings"

export async function index(
  transport: Transport,
  query: ListingQuery = {},
): Promise<Page<ListingCard>> {
  const payload = await transport.get<CollectionEnvelope<ListingCard>>(path, {
    query: { ...query },
  })

  return { items: payload.collection, pagination: payload.pagination, filters: payload.filters }
}

export async function show(transport: Transport, slug: string): Promise<Listing> {
  return resource(await transport.get<Envelope<Listing>>(`${path}/${encodeURIComponent(slug)}`))
}

export async function claim(transport: Transport, slug: string, userToken?: string) {
  return resource(
    await transport.post<Envelope<Listing>>(`${path}/${encodeURIComponent(slug)}/claim`, { userToken }),
  )
}

export async function search(
  transport: Transport,
  input: ListingSearchInput,
): Promise<Page<ListingCard>> {
  const payload = await transport.post<CollectionEnvelope<ListingCard>>(`${path}/search`, {
    body: input,
  })

  return { items: payload.collection, pagination: payload.pagination, filters: payload.filters }
}

export async function records(transport: Transport, slug: string): Promise<RecordGroup[]> {
  const payload = await transport.get<CollectionEnvelope<RecordGroup>>(
    `${path}/${encodeURIComponent(slug)}/records`,
  )

  return payload.collection
}
