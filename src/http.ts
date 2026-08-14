import { ApiError } from "./errors.js"
import type { Envelope, RequestOptions, Transport } from "./types.js"

/**
 * The single place an HTTP request is made.
 *
 * Every endpoint goes through here, so retries, error shapes and header handling
 * are decided once rather than per resource. Built on `fetch`, so the package has
 * no runtime dependencies at all.
 */
export function createTransport(config: {
  baseUrl: string
  apiToken: string
  userToken?: string | undefined
  fetch?: typeof globalThis.fetch
  timeout?: number
}): Transport {
  const doFetch = config.fetch ?? globalThis.fetch
  const timeout = config.timeout ?? 15_000

  if (typeof doFetch !== "function") {
    throw new Error(
      "No fetch implementation available. Pass one via mrlisting({ fetch }) on Node < 18.",
    )
  }

  async function request<T>(
    method: string,
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const url = buildUrl(config.baseUrl, path, options.query)

    const headers: Record<string, string> = {
      Accept: "application/json",
      // The directory's own credential. It identifies the tenant, so it decides
      // which data the request can see at all.
      "X-Api-Key": config.apiToken,
      ...options.headers,
    }

    // A signed-in frontend user, when there is one. Deliberately a different header
    // from the account token: they authenticate different things.
    const userToken = options.userToken ?? config.userToken
    if (userToken) headers["X-User-Token"] = userToken

    if (options.body !== undefined) headers["Content-Type"] = "application/json"

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

    let response: Response
    try {
      // Built conditionally: under exactOptionalPropertyTypes, handing `undefined`
      // to RequestInit.body is not the same as omitting it.
      const init: RequestInit = { method, headers, signal: options.signal ?? controller.signal }
      if (options.body !== undefined) init.body = JSON.stringify(options.body)

      response = await doFetch(url, init)
    } catch (cause) {
      throw ApiError.fromNetwork(cause, method, url)
    } finally {
      clearTimeout(timer)
    }

    return handle<T>(response, method, url)
  }

  async function handle<T>(response: Response, method: string, url: string): Promise<T> {
    if (response.status === 204) return undefined as T

    const payload = await readJson(response)

    if (!response.ok) throw ApiError.fromResponse(response, payload, method, url)

    return payload as T
  }

  return {
    get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, options),
    post: <T>(path: string, options?: RequestOptions) => request<T>("POST", path, options),
    patch: <T>(path: string, options?: RequestOptions) => request<T>("PATCH", path, options),
    put: <T>(path: string, options?: RequestOptions) => request<T>("PUT", path, options),
    delete: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, options),
  }
}

/** Unwraps `{ resource: ... }` so callers work with the thing, not the envelope. */
export function resource<T>(payload: Envelope<T>): T {
  return payload.resource as T
}

function buildUrl(baseUrl: string, path: string, query?: RequestOptions["query"]): string {
  const url = new URL(path.replace(/^\//, ""), ensureTrailingSlash(baseUrl))

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue
    url.searchParams.set(key, String(value))
  }

  return url.toString()
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    // A proxy or gateway answering with HTML is a real failure mode; keep the body
    // so the thrown error says what actually came back.
    return { errors: [text.slice(0, 500)] }
  }
}
