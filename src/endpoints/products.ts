import { resource } from "../http.js"
import type { CheckoutSession, CollectionEnvelope, Envelope, Product, Transport } from "../types.js"

const path = "products"

export interface ProductReadOptions {
  userToken?: string

  resolve?: boolean
}

export async function index(
  transport: Transport,
  options: string | ProductReadOptions = {},
): Promise<Product[]> {
  const opts = typeof options === "string" ? { userToken: options } : options
  const payload = await transport.get<CollectionEnvelope<Product>>(path, {
    userToken: opts.userToken,
    query: opts.resolve ? { resolve: true } : undefined,
  })

  return payload.collection
}

export async function byKey(
  transport: Transport,
  key: string,
  options: ProductReadOptions = {},
): Promise<Product> {
  return resource(
    await transport.get<Envelope<Product>>(`${path}/key/${encodeURIComponent(key)}`, {
      userToken: options.userToken,
      query: options.resolve ? { resolve: true } : undefined,
    }),
  )
}

export async function checkout(
  transport: Transport,
  productId: number,
  options: { successUrl?: string; cancelUrl?: string; userToken?: string } = {},
): Promise<CheckoutSession> {
  const body: Record<string, unknown> = {}
  if (options.successUrl) body["success_url"] = options.successUrl
  if (options.cancelUrl) body["cancel_url"] = options.cancelUrl

  return resource(
    await transport.post<Envelope<CheckoutSession>>(`${path}/${productId}/checkout`, {
      body,
      userToken: options.userToken,
    }),
  )
}
