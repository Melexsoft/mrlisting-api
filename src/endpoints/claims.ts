import { resource } from "../http.js"
import type { Envelope, Listing, OwnedListing, Transport } from "../types.js"

const path = "claims"

/** Resolves a tokenised claim link: which entry it is for, and whether it is still free. */
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

/** Accepts the invitation. The signed-in user becomes the entry's owner. */
export async function accept(
  transport: Transport,
  token: string,
  userToken?: string,
): Promise<OwnedListing> {
  return resource(
    await transport.post<Envelope<OwnedListing>>(`${path}/${encodeURIComponent(token)}`, { userToken }),
  )
}

export default { show, accept }
