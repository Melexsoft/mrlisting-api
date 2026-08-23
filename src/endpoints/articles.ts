import { resource } from "../http.js"
import type {
  Article,
  ArticleCard,
  ArticleQuery,
  CollectionEnvelope,
  Envelope,
  Transport,
} from "../types.js"

export async function index(transport: Transport, query: ArticleQuery = {}) {
  const payload = await transport.get<CollectionEnvelope<ArticleCard>>("articles", {
    query: { ...query },
  })

  return { items: payload.collection, pagination: payload.pagination }
}

export async function show(transport: Transport, slug: string): Promise<Article> {
  return resource(await transport.get<Envelope<Article>>(`articles/${encodeURIComponent(slug)}`))
}
