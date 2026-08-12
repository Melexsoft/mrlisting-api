import { resource } from "../http.js"
import type { Envelope, Form, Transport } from "../types.js"

const path = "forms"

/** The field definitions to render. Never hard-code a form the directory configured. */
export async function show(transport: Transport, key: string): Promise<Form> {
  return resource(await transport.get<Envelope<Form>>(`${path}/${encodeURIComponent(key)}`))
}

/**
 * Submit a form.
 *
 * Include the honeypot field named by `show()` as an empty string; a filled one is
 * quietly treated as spam. `listingSlug` attaches the submission to an entry, which
 * is what turns a general form into a direct inquiry to that entry's owner.
 */
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

export default { show, submit }
