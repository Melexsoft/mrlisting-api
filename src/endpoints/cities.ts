import type { City, CollectionEnvelope, Transport } from "../types.js"

const path = "cities"

/** Cities this directory covers, with how many published entries each holds. */
export async function index(transport: Transport): Promise<City[]> {
  const payload = await transport.get<CollectionEnvelope<City>>(path)

  return payload.collection
}

export default { index }
