import { vi } from "vitest"

import { ApiError, mrlisting } from "../src/index.js"

/** Runs a request that is expected to fail and hands back the ApiError. */
export async function failure(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise
  } catch (error) {
    return error as ApiError
  }

  throw new Error("expected the request to fail, but it succeeded")
}

/** A fetch stand-in that records what it was asked for and replies with fixed data. */
export function stubFetch(responses: Array<{ status?: number; body?: unknown }>) {
  const calls: Array<{ url: string; init: RequestInit }> = []
  let index = 0

  const fetchMock = vi.fn(async (url: string | URL, init: RequestInit = {}) => {
    calls.push({ url: String(url), init })
    const reply = responses[Math.min(index++, responses.length - 1)] ?? {}

    const status = reply.status ?? 200
    // A 204 Response must be constructed with a null body, not an empty string.
    const body = status === 204 || reply.body === undefined ? null : JSON.stringify(reply.body)

    return new Response(body, { status, headers: { "Content-Type": "application/json" } })
  })

  return { fetchMock, calls }
}

export function client(responses: Array<{ status?: number; body?: unknown }>, userToken?: string) {
  const { fetchMock, calls } = stubFetch(responses)

  const api = mrlisting({
    baseUrl: "https://admin.example.test/api/v1",
    apiToken: "sk_directory_token",
    fetch: fetchMock as unknown as typeof fetch,
    ...(userToken ? { userToken } : {}),
  })

  return { api, calls }
}
