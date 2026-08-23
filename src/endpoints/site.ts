import { resource } from "../http.js"
import type { Envelope, Site, Sitemap, Transport } from "../types.js"

export async function show(transport: Transport): Promise<Site> {
  return resource(await transport.get<Envelope<Site>>("site"))
}

export async function sitemap(transport: Transport): Promise<Sitemap> {
  return resource(await transport.get<Envelope<Sitemap>>("sitemap"))
}
