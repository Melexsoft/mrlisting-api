import { resource } from "../http.js"
import type { CollectionEnvelope, Envelope, PageQuery, Purchase, Transport } from "../types.js"

/**
 * The signed-in user's purchases, newest first.
 *
 * Checkout's browser return trip proves nothing; the webhook is what flips a
 * purchase to `paid`. These reads are how a frontend finds out what happened.
 */
export async function index(transport: Transport, query: PageQuery = {}, userToken?: string) {
  const payload = await transport.get<CollectionEnvelope<Purchase>>("me/purchases", {
    query: { ...query },
    userToken,
  })

  return { items: payload.collection, pagination: payload.pagination }
}

/** One purchase — 404 unless it belongs to this user in this directory. */
export async function show(transport: Transport, id: number, userToken?: string): Promise<Purchase> {
  return resource(await transport.get<Envelope<Purchase>>(`me/purchases/${id}`, { userToken }))
}

export default { index, show }
