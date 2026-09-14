import type { City, CollectionEnvelope, Page, PageQuery, Transport } from "../types.js"

const path = "cities"

/**
 * One page of the directory's cities.
 *
 * The API caps an unpaginated read at 100 rows, so a directory with more
 * cities than that answers with a SLICE. The `pagination` that comes back says
 * so — read it, or use `all()` to walk every page.
 */
export async function index(transport: Transport, query: PageQuery = {}): Promise<Page<City>> {
  const payload = await transport.get<CollectionEnvelope<City>>(path, { query: { ...query } })

  return { items: payload.collection, pagination: payload.pagination }
}

/** Guards against paging forever if a server ever reported a wrong page count. */
const MAX_PAGES = 50

/**
 * Every city of the directory, pages walked for you. Use this wherever a
 * partial list would be wrong — a city picker, a sitemap, a slug lookup.
 */
export async function all(transport: Transport, perPage = 100): Promise<City[]> {
  const first = await index(transport, { per_page: perPage })
  const pages = first.pagination?.pages ?? 1
  if (pages <= 1) return first.items

  const rest = await Promise.all(
    Array.from({ length: Math.min(pages, MAX_PAGES) - 1 }, (_, offset) =>
      index(transport, { per_page: perPage, page: offset + 2 }),
    ),
  )

  return [ first.items, ...rest.map((page) => page.items) ].flat()
}
