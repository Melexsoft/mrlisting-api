import type { CollectionEnvelope, Schema, Transport } from "../types.js"

/**
 * The structured-data schemas this directory chose to expose, fields included.
 * Only schemas an administrator switched to "shown on the public API" appear.
 */
export async function index(transport: Transport): Promise<Schema[]> {
  const payload = await transport.get<CollectionEnvelope<Schema>>("schemas")

  return payload.collection
}

export default { index }
