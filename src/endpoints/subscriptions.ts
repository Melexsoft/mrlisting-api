import { resource } from "../http.js"
import type { CollectionEnvelope, Envelope, PageQuery, Subscription, Transport } from "../types.js"

export async function index(transport: Transport, query: PageQuery = {}, userToken?: string) {
  const payload = await transport.get<CollectionEnvelope<Subscription>>("me/subscriptions", {
    query: { ...query },
    userToken,
  })

  return { items: payload.collection, pagination: payload.pagination }
}

export async function show(transport: Transport, id: number, userToken?: string): Promise<Subscription> {
  return resource(await transport.get<Envelope<Subscription>>(`me/subscriptions/${id}`, { userToken }))
}

export async function cancel(transport: Transport, id: number, userToken?: string): Promise<Subscription> {
  return resource(
    await transport.post<Envelope<Subscription>>(`me/subscriptions/${id}/cancel`, { userToken }),
  )
}
