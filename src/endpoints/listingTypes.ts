import type { CollectionEnvelope, ListingType, Transport } from "../types.js"

export async function index(transport: Transport): Promise<ListingType[]> {
  const payload = await transport.get<CollectionEnvelope<ListingType>>("listing_types")

  return payload.collection
}
