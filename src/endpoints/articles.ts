import { resource } from "../http.js"
import type {
  Article,
  ArticleCard,
  ArticleQuery,
  CollectionEnvelope,
  Envelope,
  Transport,
} from "../types.js"

/**
 * Published articles, newest first. Filter by scope (`blog`, `glossar`,
 * `documentation`, `news`), by a tag's slug, or by free text.
 */
export async function index(transport: Transport, query: ArticleQuery = {}) {
  const payload = await transport.get<CollectionEnvelope<ArticleCard>>("articles", {
    query: { ...query },
  })

  return { items: payload.collection, pagination: payload.pagination }
}

/**
 * One article in full. `content` is raw markdown — rendering and sanitising it
 * is the frontend's job. Drafts 404.
 */
export async function show(transport: Transport, slug: string): Promise<Article> {
  return resource(await transport.get<Envelope<Article>>(`articles/${encodeURIComponent(slug)}`))
}

export default { index, show }
