import { resource } from "../http.js"
import type { CollectionEnvelope, Envelope, PageQuery, Subscription, Transport } from "../types.js"

/**
 * The signed-in user's subscriptions, newest first. Stripe owns the truth;
 * the directory mirrors it through its webhook and answers from that mirror.
 */
export async function index(transport: Transport, query: PageQuery = {}, userToken?: string) {
  const payload = await transport.get<CollectionEnvelope<Subscription>>("me/subscriptions", {
    query: { ...query },
    userToken,
  })

  return { items: payload.collection, pagination: payload.pagination }
}

/** One subscription — 404 unless it belongs to this user in this directory. */
export async function show(transport: Transport, id: number, userToken?: string): Promise<Subscription> {
  return resource(await transport.get<Envelope<Subscription>>(`me/subscriptions/${id}`, { userToken }))
}

/**
 * Schedule the cancellation for the period's end. What was paid for stays
 * available until then; the webhook flips the status to canceled when Stripe does.
 */
export async function cancel(transport: Transport, id: number, userToken?: string): Promise<Subscription> {
  return resource(
    await transport.post<Envelope<Subscription>>(`me/subscriptions/${id}/cancel`, { userToken }),
  )
}

export default { index, show, cancel }
