import * as auth from "./endpoints/auth.js"
import * as categories from "./endpoints/categories.js"
import * as cities from "./endpoints/cities.js"
import * as claims from "./endpoints/claims.js"
import * as forms from "./endpoints/forms.js"
import * as leadQuestions from "./endpoints/leadQuestions.js"
import * as listings from "./endpoints/listings.js"
import * as listingTypes from "./endpoints/listingTypes.js"
import * as me from "./endpoints/me.js"
import * as products from "./endpoints/products.js"
import * as purchases from "./endpoints/purchases.js"
import * as reviews from "./endpoints/reviews.js"
import * as schemas from "./endpoints/schemas.js"
import * as site from "./endpoints/site.js"
import * as subscriptions from "./endpoints/subscriptions.js"
import { createTransport } from "./http.js"
import type {
  ClientConfig, LeadAnswerValue, ListingQuery, PageQuery, Transport,
} from "./types.js"

export { ApiError } from "./errors.js"
export type * from "./types.js"

/**
 * A MrListing API client.
 *
 * ```ts
 * const api = mrlisting({ baseUrl: process.env.MRLISTING_URL!, apiToken: process.env.MRLISTING_TOKEN! })
 *
 * const { items } = await api.listings.index({ q: "elmau" })
 * const entry     = await api.listings.show("schloss-elmau")
 * ```
 *
 * Namespaces mirror the API's own resources, and the verbs are the ones the API
 * uses: `index`, `show`, `create`, `update`.
 */
export function mrlisting(config: ClientConfig) {
  if (!config.apiToken) throw new Error("mrlisting() needs an apiToken.")
  if (!config.baseUrl) throw new Error("mrlisting() needs a baseUrl.")

  const transport = createTransport(config)

  return buildClient(transport, config)
}

function buildClient(transport: Transport, config: ClientConfig) {
  return {
    /** Identity, active forms and counts for this directory. */
    site: {
      show: () => site.show(transport),
      sitemap: () => site.sitemap(transport),
    },

    listings: {
      index: (query?: ListingQuery) => listings.index(transport, query),
      show: (slug: string) => listings.show(transport, slug),
      claim: (slug: string, userToken?: string) => listings.claim(transport, slug, userToken),
      reviews: (slug: string, query?: PageQuery) => reviews.forListing(transport, slug, query),
      records: (slug: string) => listings.records(transport, slug),
      search: (input: Parameters<typeof listings.search>[1]) => listings.search(transport, input),
    },

    /** Structured-data schemas the directory chose to expose. */
    schemas: {
      index: () => schemas.index(transport),
    },

    /** Reading and leaving reviews through an invitation link. */
    reviews: {
      showRequest: (token: string) => reviews.showRequest(transport, token),
      submitFromRequest: (token: string, input: Parameters<typeof reviews.submitFromRequest>[2]) =>
        reviews.submitFromRequest(transport, token, input),
    },

    listingTypes: {
      index: () => listingTypes.index(transport),
    },

    /** The questions this directory asks right after signup. */
    leadQuestions: {
      index: () => leadQuestions.index(transport),
    },

    categories: {
      index: () => categories.index(transport),
    },

    cities: {
      index: () => cities.index(transport),
    },

    forms: {
      show: (key: string) => forms.show(transport, key),
      submit: (key: string, input: Parameters<typeof forms.submit>[2]) =>
        forms.submit(transport, key, input),
    },

    /** Sign-in for this directory's own frontend users. */
    auth: {
      login: (input: Parameters<typeof auth.login>[1]) => auth.login(transport, input),
      signup: (input: Parameters<typeof auth.signup>[1]) => auth.signup(transport, input),
      logout: (userToken?: string) => auth.logout(transport, userToken),
      requestPasswordReset: (email: string) => auth.requestPasswordReset(transport, email),
      resetPassword: (input: Parameters<typeof auth.resetPassword>[1]) =>
        auth.resetPassword(transport, input),
    },

    /** The signed-in user's own profile, entries, purchases and answers. */
    me: {
      show: (userToken?: string) => me.show(transport, userToken),
      update: (input: Parameters<typeof me.update>[1], userToken?: string) =>
        me.update(transport, input, userToken),
      listings: (userToken?: string) => me.listings(transport, userToken),
      updateListing: (slug: string, input: Record<string, unknown>, userToken?: string) =>
        me.updateListing(transport, slug, input, userToken),
      requestReview: (slug: string, input: Parameters<typeof me.requestReview>[2], userToken?: string) =>
        me.requestReview(transport, slug, input, userToken),
      purchases: (query?: PageQuery, userToken?: string) =>
        purchases.index(transport, query, userToken),
      purchase: (id: number, userToken?: string) => purchases.show(transport, id, userToken),
      subscriptions: (query?: PageQuery, userToken?: string) =>
        subscriptions.index(transport, query, userToken),
      subscription: (id: number, userToken?: string) => subscriptions.show(transport, id, userToken),
      cancelSubscription: (id: number, userToken?: string) =>
        subscriptions.cancel(transport, id, userToken),
      leadAnswers: (userToken?: string) => leadQuestions.answers(transport, userToken),
      submitLeadAnswers: (answers: Record<string, LeadAnswerValue>, userToken?: string) =>
        leadQuestions.submitAnswers(transport, answers, userToken),
    },

    claims: {
      show: (token: string) => claims.show(transport, token),
      accept: (token: string, userToken?: string) => claims.accept(transport, token, userToken),
    },

    /** Only present in directories that sell something. */
    products: {
      index: (userToken?: string) => products.index(transport, userToken),
      checkout: (productId: number, options?: Parameters<typeof products.checkout>[2]) =>
        products.checkout(transport, productId, options),
    },

    /**
     * A client bound to one signed-in user, so their token does not have to be
     * threaded through every call.
     *
     * ```ts
     * const asUser = api.withUser(token)
     * await asUser.me.listings()
     * ```
     */
    withUser(userToken: string) {
      return mrlisting({ ...config, userToken })
    },
  }
}

export type MrListingClient = ReturnType<typeof mrlisting>

export default mrlisting
