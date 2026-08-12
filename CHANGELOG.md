# Changelog

## 0.1.0

First release.

- Factory client: `mrlisting({ baseUrl, apiToken })`, namespaced by resource
- Content: `site`, `listings`, `categories`, `cities`, `forms`
- Auth for a directory's own frontend users, plus `withUser(token)`
- `me`: profile and owned entries
- Claiming, by tokenised link or from a public profile
- Products and Stripe Checkout, for directories that sell
- Typed `ApiError` with `isUnauthorized` / `isForbidden` / `isNotFound` / `isValidationError` / `isRateLimited`
- No runtime dependencies; ESM and CJS builds with type declarations
