import { resource } from "../http.js"
import type { Envelope, Site, Sitemap, Transport } from "../types.js"

/** Everything a frontend needs to boot: identity, active forms, counts. */
export async function show(transport: Transport): Promise<Site> {
  return resource(await transport.get<Envelope<Site>>("site"))
}

/** Every URL worth exposing, each flagged with whether it should be indexed. */
export async function sitemap(transport: Transport): Promise<Sitemap> {
  return resource(await transport.get<Envelope<Sitemap>>("sitemap"))
}

export default { show, sitemap }
