import { resource } from "../http.js"
import type {
  CollectionEnvelope, DirectoryUser, Envelope, ListingRecord, OwnedListing,
  OwnerRecordGroup, RecordValue, ReviewRequestReceipt, Transport,
} from "../types.js"

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

export async function listings(transport: Transport, userToken?: string): Promise<OwnedListing[]> {
  const payload = await transport.get<CollectionEnvelope<OwnedListing>>("me/listings", { userToken })

  return payload.collection
}

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

export async function requestReview(
  transport: Transport,
  slug: string,
  input: { email: string; name?: string | undefined },
  userToken?: string,
): Promise<ReviewRequestReceipt> {
  return resource(
    await transport.post<Envelope<ReviewRequestReceipt>>(
      `me/listings/${encodeURIComponent(slug)}/review_requests`,
      { body: { review_request: input }, userToken },
    ),
  )
}


export type Upload = Blob | { blob: Blob; filename: string }

function appended(form: FormData, name: string, upload: Upload): void {
  if (upload instanceof Blob) form.append(name, upload)
  else form.append(name, upload.blob, upload.filename)
}

export async function addListingPhotos(
  transport: Transport,
  slug: string,
  photos: Upload[] | FormData,
  userToken?: string,
): Promise<OwnedListing> {
  let body: FormData
  if (photos instanceof FormData) {
    body = photos
  } else {
    body = new FormData()
    for (const photo of photos) appended(body, "photos[]", photo)
  }

  return resource(
    await transport.post<Envelope<OwnedListing>>(
      `me/listings/${encodeURIComponent(slug)}/photos`,
      { body, userToken },
    ),
  )
}

export async function removeListingPhoto(
  transport: Transport,
  slug: string,
  photoId: number,
  userToken?: string,
): Promise<OwnedListing> {
  return resource(
    await transport.delete<Envelope<OwnedListing>>(
      `me/listings/${encodeURIComponent(slug)}/photos/${photoId}`,
      { userToken },
    ),
  )
}

async function putSingleImage(
  transport: Transport,
  slug: string,
  field: "banner" | "logo",
  upload: Upload | FormData,
  userToken?: string,
): Promise<OwnedListing> {
  let body: FormData
  if (upload instanceof FormData) {
    body = upload
  } else {
    body = new FormData()
    appended(body, field, upload)
  }

  return resource(
    await transport.put<Envelope<OwnedListing>>(
      `me/listings/${encodeURIComponent(slug)}/${field}`,
      { body, userToken },
    ),
  )
}

async function deleteSingleImage(
  transport: Transport,
  slug: string,
  field: "banner" | "logo",
  userToken?: string,
): Promise<OwnedListing> {
  return resource(
    await transport.delete<Envelope<OwnedListing>>(
      `me/listings/${encodeURIComponent(slug)}/${field}`,
      { userToken },
    ),
  )
}

export function setListingBanner(
  transport: Transport, slug: string, upload: Upload | FormData, userToken?: string,
): Promise<OwnedListing> {
  return putSingleImage(transport, slug, "banner", upload, userToken)
}

export function removeListingBanner(
  transport: Transport, slug: string, userToken?: string,
): Promise<OwnedListing> {
  return deleteSingleImage(transport, slug, "banner", userToken)
}

export function setListingLogo(
  transport: Transport, slug: string, upload: Upload | FormData, userToken?: string,
): Promise<OwnedListing> {
  return putSingleImage(transport, slug, "logo", upload, userToken)
}

export function removeListingLogo(
  transport: Transport, slug: string, userToken?: string,
): Promise<OwnedListing> {
  return deleteSingleImage(transport, slug, "logo", userToken)
}

export async function listingRecords(
  transport: Transport,
  slug: string,
  userToken?: string,
): Promise<OwnerRecordGroup[]> {
  const payload = await transport.get<CollectionEnvelope<OwnerRecordGroup>>(
    `me/listings/${encodeURIComponent(slug)}/records`,
    { userToken },
  )

  return payload.collection
}

export async function updateListingRecord(
  transport: Transport,
  slug: string,
  schemaKey: string,
  values: Record<string, RecordValue>,
  userToken?: string,
): Promise<ListingRecord> {
  return resource(
    await transport.put<Envelope<ListingRecord>>(
      `me/listings/${encodeURIComponent(slug)}/records/${encodeURIComponent(schemaKey)}`,
      { body: { values }, userToken },
    ),
  )
}
