import { resource } from "../http.js"
import type { CheckoutSession, CollectionEnvelope, Envelope, Product, Transport } from "../types.js"

const path = "products"

/**
 * What the signed-in user may buy.
 *
 * The audience rule is applied server-side: a product meant for entry owners is
 * never listed to a plain visitor. Without a user token the list is empty, and a
 * directory that sells nothing answers 404.
 */
export async function index(transport: Transport, userToken?: string): Promise<Product[]> {
  const payload = await transport.get<CollectionEnvelope<Product>>(path, { userToken })

  return payload.collection
}

/**
 * Starts a Stripe Checkout session in the directory's own Stripe account and returns
 * the URL to send the buyer to. Payment is only confirmed by Stripe's webhook, never
 * by the buyer's return trip.
 */
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

export default { index, checkout }
