import { resource } from "../http.js"
import type { CollectionEnvelope, DirectoryUser, Envelope, OwnedListing, Transport } from "../types.js"

/** The signed-in user's own profile. */
export async function show(transport: Transport, userToken?: string): Promise<DirectoryUser> {
  return resource(await transport.get<Envelope<DirectoryUser>>("me", { userToken }))
}

export async function update(
  transport: Transport,
  input: { name?: string; password?: string; password_confirmation?: string },
  userToken?: string,
): Promise<DirectoryUser> {
  return resource(await transport.patch<Envelope<DirectoryUser>>("me", { body: { user: input }, userToken }))
}

/** Entries this user owns — never anyone else's. */
export async function listings(transport: Transport, userToken?: string): Promise<OwnedListing[]> {
  const payload = await transport.get<CollectionEnvelope<OwnedListing>>("me/listings", { userToken })

  return payload.collection
}

/**
 * Edit an entry this user owns.
 *
 * An owner edits their own copy: publishing, ranking and ownership belong to the
 * directory's editors and are not accepted here.
 */
export async function updateListing(
  transport: Transport,
  slug: string,
  input: Record<string, unknown>,
  userToken?: string,
): Promise<OwnedListing> {
  return resource(
    await transport.patch<Envelope<OwnedListing>>(`me/listings/${encodeURIComponent(slug)}`, {
      body: { listing: input },
      userToken,
    }),
  )
}

export default { show, update, listings, updateListing }
