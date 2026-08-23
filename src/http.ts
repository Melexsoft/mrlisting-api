import { ApiError } from "./errors.js"
import type { Envelope, RequestOptions, Transport } from "./types.js"

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

      "X-Api-Key": config.apiToken,
      ...options.headers,
    }

    const userToken = options.userToken ?? config.userToken
    if (userToken) headers["X-User-Token"] = userToken

    const multipart = typeof FormData !== "undefined" && options.body instanceof FormData
    if (options.body !== undefined && !multipart) headers["Content-Type"] = "application/json"

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

    let response: Response
    try {

      const init: RequestInit = { method, headers, signal: options.signal ?? controller.signal }
      if (options.body !== undefined) {
        init.body = multipart ? (options.body as FormData) : JSON.stringify(options.body)
      }

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

    return { errors: [text.slice(0, 500)] }
  }
}
