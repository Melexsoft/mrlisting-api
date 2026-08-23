import type { CollectionEnvelope, Schema, Transport } from "../types.js"

export async function index(transport: Transport): Promise<Schema[]> {
  const payload = await transport.get<CollectionEnvelope<Schema>>("schemas")

  return payload.collection
}
