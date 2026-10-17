import { resource } from "../http.js"
import type { Envelope, Transport, WatchConfirmation, WatchInput } from "../types.js"

const path = "watches"

export async function create(transport: Transport, input: WatchInput): Promise<{ status: "pending" }> {
  const body: Record<string, unknown> = { email: input.email }
  if (input.listingSlug) body["listing_slug"] = input.listingSlug
  if (input.citySlug) body["city_slug"] = input.citySlug
  if (input.source) body["source"] = input.source
  if (input.honeypot) body["company_website"] = input.honeypot

  return resource(await transport.post<Envelope<{ status: "pending" }>>(path, { body }))
}

export async function confirm(transport: Transport, token: string): Promise<WatchConfirmation> {
  return resource(
    await transport.post<Envelope<WatchConfirmation>>(`${path}/confirm/${encodeURIComponent(token)}`),
  )
}

export async function unsubscribe(transport: Transport, token: string): Promise<{ status: "deleted" }> {
  return resource(
    await transport.post<Envelope<{ status: "deleted" }>>(`${path}/unsubscribe/${encodeURIComponent(token)}`),
  )
}
