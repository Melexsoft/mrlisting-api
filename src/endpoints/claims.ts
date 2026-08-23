import { resource } from "../http.js"
import type { Envelope, Listing, OwnedListing, Transport } from "../types.js"

const path = "claims"

export async function show(
  transport: Transport,
  token: string,
): Promise<{ listing: Listing; claimed: boolean }> {
  return resource(
    await transport.get<Envelope<{ listing: Listing; claimed: boolean }>>(
      `${path}/${encodeURIComponent(token)}`,
    ),
  )
}

export async function accept(
  transport: Transport,
  token: string,
  userToken?: string,
): Promise<OwnedListing> {
  return resource(
    await transport.post<Envelope<OwnedListing>>(`${path}/${encodeURIComponent(token)}`, { userToken }),
  )
}
