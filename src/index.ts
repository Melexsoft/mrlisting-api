import * as articles from "./endpoints/articles.js"
import * as auth from "./endpoints/auth.js"
import * as categories from "./endpoints/categories.js"
import * as cities from "./endpoints/cities.js"
import * as claims from "./endpoints/claims.js"
import * as conversations from "./endpoints/conversations.js"
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
  ArticleQuery, ClientConfig, LeadAnswerValue, ListingQuery, PageQuery, Transport,
} from "./types.js"

export { ApiError } from "./errors.js"
export type * from "./types.js"

export function mrlisting(config: ClientConfig) {
  if (!config.apiToken) throw new Error("mrlisting() needs an apiToken.")
  if (!config.baseUrl) throw new Error("mrlisting() needs a baseUrl.")

  const transport = createTransport(config)

  return buildClient(transport, config)
}

function buildClient(transport: Transport, config: ClientConfig) {
  return {

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

    schemas: {
      index: () => schemas.index(transport),
    },

    reviews: {
      showRequest: (token: string) => reviews.showRequest(transport, token),
      submitFromRequest: (token: string, input: Parameters<typeof reviews.submitFromRequest>[2]) =>
        reviews.submitFromRequest(transport, token, input),
    },

    listingTypes: {
      index: () => listingTypes.index(transport),
    },

    leadQuestions: {
      index: () => leadQuestions.index(transport),
    },

    categories: {
      index: () => categories.index(transport),
    },

    articles: {
      index: (query?: ArticleQuery) => articles.index(transport, query),
      show: (slug: string) => articles.show(transport, slug),
    },

    cities: {
      index: () => cities.index(transport),
    },

    forms: {
      show: (key: string) => forms.show(transport, key),
      submit: (key: string, input: Parameters<typeof forms.submit>[2]) =>
        forms.submit(transport, key, input),
    },

    auth: {
      login: (input: Parameters<typeof auth.login>[1]) => auth.login(transport, input),
      signup: (input: Parameters<typeof auth.signup>[1]) => auth.signup(transport, input),
      logout: (userToken?: string) => auth.logout(transport, userToken),
      requestPasswordReset: (email: string) => auth.requestPasswordReset(transport, email),
      resetPassword: (input: Parameters<typeof auth.resetPassword>[1]) =>
        auth.resetPassword(transport, input),
    },

    me: {
      show: (userToken?: string) => me.show(transport, userToken),
      update: (input: Parameters<typeof me.update>[1], userToken?: string) =>
        me.update(transport, input, userToken),
      listings: (userToken?: string) => me.listings(transport, userToken),
      updateListing: (slug: string, input: Record<string, unknown>, userToken?: string) =>
        me.updateListing(transport, slug, input, userToken),
      requestReview: (slug: string, input: Parameters<typeof me.requestReview>[2], userToken?: string) =>
        me.requestReview(transport, slug, input, userToken),

      addListingPhotos: (slug: string, photos: Parameters<typeof me.addListingPhotos>[2], userToken?: string) =>
        me.addListingPhotos(transport, slug, photos, userToken),
      removeListingPhoto: (slug: string, photoId: number, userToken?: string) =>
        me.removeListingPhoto(transport, slug, photoId, userToken),

      setListingBanner: (slug: string, upload: Parameters<typeof me.setListingBanner>[2], userToken?: string) =>
        me.setListingBanner(transport, slug, upload, userToken),
      removeListingBanner: (slug: string, userToken?: string) =>
        me.removeListingBanner(transport, slug, userToken),
      setListingLogo: (slug: string, upload: Parameters<typeof me.setListingLogo>[2], userToken?: string) =>
        me.setListingLogo(transport, slug, upload, userToken),
      removeListingLogo: (slug: string, userToken?: string) =>
        me.removeListingLogo(transport, slug, userToken),

      listingRecords: (slug: string, userToken?: string) =>
        me.listingRecords(transport, slug, userToken),

      updateListingRecord: (
        slug: string,
        schemaKey: string,
        values: Parameters<typeof me.updateListingRecord>[3],
        userToken?: string,
      ) => me.updateListingRecord(transport, slug, schemaKey, values, userToken),
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

      inquiries: (query?: PageQuery, userToken?: string) =>
        conversations.inquiries(transport, query, userToken),

      startConversation: (inquiryId: number, body: string, userToken?: string) =>
        conversations.startFromInquiry(transport, inquiryId, body, userToken),
      conversations: (query?: PageQuery, userToken?: string) =>
        conversations.index(transport, query, userToken),
      conversation: (id: number, userToken?: string) => conversations.show(transport, id, userToken),

      conversationMessages: (id: number, query?: PageQuery, userToken?: string) =>
        conversations.messages(transport, id, query, userToken),
      sendConversationMessage: (id: number, body: string, userToken?: string) =>
        conversations.sendMessage(transport, id, body, userToken),
    },

    claims: {
      show: (token: string) => claims.show(transport, token),
      accept: (token: string, userToken?: string) => claims.accept(transport, token, userToken),
    },

    guest: {
      conversation: (token: string) => conversations.showGuest(transport, token),
      reply: (token: string, body: string) => conversations.replyAsGuest(transport, token, body),
    },

    products: {
      index: (options?: string | products.ProductReadOptions) => products.index(transport, options),
      byKey: (key: string, options?: products.ProductReadOptions) =>
        products.byKey(transport, key, options),
      checkout: (productId: number, options?: Parameters<typeof products.checkout>[2]) =>
        products.checkout(transport, productId, options),
    },

    withUser(userToken: string) {
      return mrlisting({ ...config, userToken })
    },
  }
}

export type MrListingClient = ReturnType<typeof mrlisting>

export default mrlisting
