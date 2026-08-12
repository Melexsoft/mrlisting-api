import type { CollectionEnvelope, Category, Transport } from "../types.js"

const path = "categories"

/** Published categories, in the order the directory arranged them. */
export async function index(transport: Transport): Promise<Category[]> {
  const payload = await transport.get<CollectionEnvelope<Category>>(path)

  return payload.collection
}

export default { index }
