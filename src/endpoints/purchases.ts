import { resource } from "../http.js"
import type { CollectionEnvelope, Envelope, PageQuery, Purchase, Transport } from "../types.js"

export async function index(transport: Transport, query: PageQuery = {}, userToken?: string) {
  const payload = await transport.get<CollectionEnvelope<Purchase>>("me/purchases", {
    query: { ...query },
    userToken,
  })

  return { items: payload.collection, pagination: payload.pagination }
}

export async function show(transport: Transport, id: number, userToken?: string): Promise<Purchase> {
  return resource(await transport.get<Envelope<Purchase>>(`me/purchases/${id}`, { userToken }))
}
