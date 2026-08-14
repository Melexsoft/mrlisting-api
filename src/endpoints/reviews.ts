import { resource } from "../http.js"
import type {
  CollectionEnvelope, Envelope, PageQuery, Review, ReviewInput, ReviewRequestLanding,
  ReviewSummary, Transport,
} from "../types.js"

/** Published reviews for one entry, with the summary the page needs. */
export async function forListing(transport: Transport, slug: string, query: PageQuery = {}) {
  const payload = await transport.get<CollectionEnvelope<Review> & { summary: ReviewSummary }>(
    `listings/${encodeURIComponent(slug)}/reviews`,
    { query: { ...query } },
  )

  return { items: payload.collection, pagination: payload.pagination, summary: payload.summary }
}

/** What a review invitation link points at, and whether it is still good. */
export async function showRequest(transport: Transport, token: string): Promise<ReviewRequestLanding> {
  return resource(
    await transport.get<Envelope<ReviewRequestLanding>>(`reviews/${encodeURIComponent(token)}`),
  )
}

/**
 * Leave the review a link invited. Possession of the token is the proof, so the
 * review is published straight away — and the link only works once.
 */
export async function submitFromRequest(
  transport: Transport,
  token: string,
  input: ReviewInput,
): Promise<Review> {
  return resource(
    await transport.post<Envelope<Review>>(`reviews/${encodeURIComponent(token)}`, {
      body: { review: input },
    }),
  )
}

export default { forListing, showRequest, submitFromRequest }
