import type { City, CollectionEnvelope, Transport } from "../types.js"

const path = "cities"

export async function index(transport: Transport): Promise<City[]> {
  const payload = await transport.get<CollectionEnvelope<City>>(path)

  return payload.collection
}
