/**
 * Every failure from the API arrives as one of these.
 *
 * The API always answers with `{ errors: [...] }`, so the messages are lifted out
 * and the status is kept alongside them — a caller should never have to dig through
 * a response object to find out what went wrong.
 */
export class ApiError extends Error {
  readonly status: number
  readonly errors: string[]
  readonly method: string
  readonly url: string
  readonly cause?: unknown

  constructor(init: {
    message: string
    status: number
    errors?: string[]
    method: string
    url: string
    cause?: unknown
  }) {
    super(init.message)
    this.name = "ApiError"
    this.status = init.status
    this.errors = init.errors ?? [init.message]
    this.method = init.method
    this.url = init.url
    if (init.cause !== undefined) this.cause = init.cause
  }

  static fromResponse(response: Response, payload: unknown, method: string, url: string): ApiError {
    const errors = extractErrors(payload)

    return new ApiError({
      message: errors[0] ?? `${response.status} ${response.statusText}`,
      status: response.status,
      errors,
      method,
      url,
    })
  }

  /** A request that never reached the API: DNS, TLS, timeout, offline. */
  static fromNetwork(cause: unknown, method: string, url: string): ApiError {
    const aborted = cause instanceof Error && cause.name === "AbortError"

    return new ApiError({
      message: aborted ? "The request timed out." : "Could not reach the MrListing API.",
      status: 0,
      method,
      url,
      cause,
    })
  }

  /** The credential was missing, wrong, or has been rotated. */
  get isUnauthorized(): boolean {
    return this.status === 401
  }

  /** Signed in, but not allowed: a suspended directory, or the wrong audience. */
  get isForbidden(): boolean {
    return this.status === 403
  }

  get isNotFound(): boolean {
    return this.status === 404
  }

  get isValidationError(): boolean {
    return this.status === 422
  }

  get isRateLimited(): boolean {
    return this.status === 429
  }
}

function extractErrors(payload: unknown): string[] {
  if (payload && typeof payload === "object" && "errors" in payload) {
    const errors = (payload as { errors: unknown }).errors
    if (Array.isArray(errors)) return errors.map(String)
  }

  return []
}
