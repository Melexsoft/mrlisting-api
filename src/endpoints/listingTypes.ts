import type { CollectionEnvelope, ListingType, Transport } from "../types.js"

/** The directory's own kinds of entries, in the order its editors chose. */
export async function index(transport: Transport): Promise<ListingType[]> {
  const payload = await transport.get<CollectionEnvelope<ListingType>>("listing_types")

  return payload.collection
}

export default { index }
