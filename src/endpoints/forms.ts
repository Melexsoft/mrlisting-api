import { resource } from "../http.js"
import type { Envelope, Form, Transport } from "../types.js"

const path = "forms"

export async function show(transport: Transport, key: string): Promise<Form> {
  return resource(await transport.get<Envelope<Form>>(`${path}/${encodeURIComponent(key)}`))
}

export async function submit(
  transport: Transport,
  key: string,
  input: { data: Record<string, unknown>; listingSlug?: string; userToken?: string },
): Promise<{ message: string }> {
  const body: Record<string, unknown> = { data: input.data }
  if (input.listingSlug) body["listing_slug"] = input.listingSlug

  return resource(
    await transport.post<Envelope<{ message: string }>>(
      `${path}/${encodeURIComponent(key)}/submissions`,
      { body, userToken: input.userToken },
    ),
  )
}
