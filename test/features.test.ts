import { describe, expect, it } from "vitest"

import { client, failure } from "./helpers.js"

describe("reviews", () => {
  it("reads an entry's reviews with the summary alongside", async () => {
    const { api, calls } = client([
      {
        body: {
          collection: [ { rating: 5, title: "Lovely", body: "Easy.", author: "Alex", verified: true } ],
          pagination: { current: 1, previous: null, next: null, per_page: 25, pages: 1, count: 1 },
          summary: { rating_average: 5, reviews_count: 1 },
        },
      },
    ])

    const { items, pagination, summary } = await api.listings.reviews("cafe-adler", { page: 1 })

    expect(calls[0]?.url).toContain("listings/cafe-adler/reviews?page=1")
    expect(items[0]?.author).toBe("Alex")
    expect(pagination?.count).toBe(1)
    expect(summary.reviews_count).toBe(1)
  })

  it("resolves an invitation link to its entry", async () => {
    const { api, calls } = client([
      { body: { resource: { listing: { slug: "cafe-adler" }, recipient_name: "Alex", open: true } } },
    ])

    const landing = await api.reviews.showRequest("tok/en")

    expect(calls[0]?.url).toContain("reviews/tok%2Fen")
    expect(landing.listing.slug).toBe("cafe-adler")
    expect(landing.open).toBe(true)
  })

  it("submits the invited review", async () => {
    const { api, calls } = client([
      { status: 201, body: { resource: { rating: 5, verified: true, author: "Alex" } } },
    ])

    const review = await api.reviews.submitFromRequest("token123", { rating: 5, title: "Lovely" })

    expect(calls[0]?.init.method).toBe("POST")
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({ review: { rating: 5, title: "Lovely" } })
    expect(review.verified).toBe(true)
  })

  it("lets an owner ask their own customer", async () => {
    const { api, calls } = client(
      [ { status: 201, body: { resource: { email: "kunde@example.com", status: "sent" } } } ],
      "owner-jwt",
    )

    const receipt = await api.me.requestReview("cafe-adler", { email: "kunde@example.com", name: "Anna" })

    expect(calls[0]?.url).toContain("me/listings/cafe-adler/review_requests")
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({
      review_request: { email: "kunde@example.com", name: "Anna" },
    })
    expect(receipt.status).toBe("sent")
  })
})

describe("purchases", () => {
  it("lists the signed-in user's purchases with pagination", async () => {
    const { api, calls } = client(
      [
        {
          body: {
            collection: [ { id: 7, status: "paid", amount_formatted: "€19,90", product: { name: "Featured" } } ],
            pagination: { current: 1, previous: null, next: null, per_page: 25, pages: 1, count: 1 },
          },
        },
      ],
      "user-jwt",
    )

    const { items, pagination } = await api.me.purchases()

    expect(calls[0]?.url).toContain("me/purchases")
    expect(calls[0]?.init.headers).toMatchObject({ "X-User-Token": "user-jwt" })
    expect(items[0]?.status).toBe("paid")
    expect(pagination?.count).toBe(1)
  })

  it("reads one purchase so a success page can tell paid from pending", async () => {
    const { api, calls } = client([ { body: { resource: { id: 7, status: "pending" } } } ], "user-jwt")

    const purchase = await api.me.purchase(7)

    expect(calls[0]?.url).toContain("me/purchases/7")
    expect(purchase.status).toBe("pending")
  })

  it("surfaces a 404 for someone else's purchase", async () => {
    const { api } = client([ { status: 404, body: { errors: [ "Not found." ] } } ], "user-jwt")

    const error = await failure(api.me.purchase(999))

    expect(error.isNotFound).toBe(true)
  })
})

describe("subscriptions", () => {
  it("lists the signed-in user's subscriptions", async () => {
    const { api, calls } = client(
      [
        {
          body: {
            collection: [ { id: 4, status: "active", cancel_at_period_end: false,
              product: { name: "Pro membership" } } ],
            pagination: { current: 1, previous: null, next: null, per_page: 25, pages: 1, count: 1 },
          },
        },
      ],
      "user-jwt",
    )

    const { items } = await api.me.subscriptions()

    expect(calls[0]?.url).toContain("me/subscriptions")
    expect(items[0]?.status).toBe("active")
  })

  it("cancels at the period's end", async () => {
    const { api, calls } = client(
      [ { body: { resource: { id: 4, status: "active", cancel_at_period_end: true } } } ],
      "user-jwt",
    )

    const subscription = await api.me.cancelSubscription(4)

    expect(calls[0]?.url).toContain("me/subscriptions/4/cancel")
    expect(calls[0]?.init.method).toBe("POST")
    expect(subscription.cancel_at_period_end).toBe(true)
  })

  it("relays the server's refusal to cancel twice", async () => {
    const { api } = client(
      [ { status: 422, body: { errors: [ "This subscription is already ending." ] } } ],
      "user-jwt",
    )

    const error = await failure(api.me.cancelSubscription(4))

    expect(error.isValidationError).toBe(true)
  })
})

describe("listing types", () => {
  it("returns the directory's types in order", async () => {
    const { api, calls } = client([
      { body: { collection: [ { key: "venue", name: "Venue", position: 1 } ] } },
    ])

    const types = await api.listingTypes.index()

    expect(calls[0]?.url).toContain("listing_types")
    expect(types).toEqual([ { key: "venue", name: "Venue", position: 1 } ])
  })
})

describe("schemas and records", () => {
  it("reads the schemas the directory chose to expose", async () => {
    const { api, calls } = client([
      {
        body: {
          collection: [
            { key: "shareholders", name: "Shareholders", cardinality: "one_to_many",
              fields: [ { key: "name", label: "Name", field_type: "string", required: true, options: [] } ] },
          ],
        },
      },
    ])

    const schemas = await api.schemas.index()

    expect(calls[0]?.url).toContain("/schemas")
    expect(schemas[0]?.fields[0]?.key).toBe("name")
  })

  it("searches listings by structured data", async () => {
    const { api, calls } = client([
      {
        body: {
          collection: [ { slug: "acme-gmbh", name: "Acme GmbH" } ],
          pagination: { current: 1, previous: null, next: null, per_page: 25, pages: 1, count: 1 },
          filters: { schema: "shareholders" },
        },
      },
    ])

    const { items, filters } = await api.listings.search({
      schema: "shareholders",
      q: "anna",
      filters: [ { field: "share_percent", operator: "gt", value: 25 } ],
    })

    expect(calls[0]?.url).toContain("listings/search")
    expect(calls[0]?.init.method).toBe("POST")
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({
      schema: "shareholders",
      q: "anna",
      filters: [ { field: "share_percent", operator: "gt", value: 25 } ],
    })
    expect(items[0]?.slug).toBe("acme-gmbh")
    expect(filters).toEqual({ schema: "shareholders" })
  })

  it("relays the server's verdict on a filter it refuses", async () => {
    const { api } = client([
      { status: 422, body: { errors: [ "There is no field 'salary' in this schema." ] } },
    ])

    const error = await failure(api.listings.search({
      schema: "shareholders",
      filters: [ { field: "salary", value: "1" } ],
    }))

    expect(error.isValidationError).toBe(true)
  })

  it("reads an entry's records grouped by schema", async () => {
    const { api, calls } = client([
      {
        body: {
          collection: [
            {
              schema: { key: "shareholders", name: "Shareholders", cardinality: "one_to_many" },
              records: [ { id: 1, title: "Anna Muster", values: { name: "Anna Muster", share_percent: 25.5 } } ],
            },
          ],
        },
      },
    ])

    const groups = await api.listings.records("acme-gmbh")

    expect(calls[0]?.url).toContain("listings/acme-gmbh/records")
    expect(groups[0]?.records[0]?.values["share_percent"]).toBe(25.5)
  })
})

describe("lead questions", () => {
  it("reads the questions a new user should be asked", async () => {
    const { api, calls } = client([
      {
        body: {
          collection: [
            { key: "planning", question: "What are you planning?", field_type: "single_choice",
              required: true, options: [ "A wedding", "A party" ], hint: null, position: 1 },
          ],
        },
      },
    ])

    const questions = await api.leadQuestions.index()

    expect(calls[0]?.url).toContain("lead_questions")
    expect(questions[0]?.options).toContain("A wedding")
  })

  it("reads back what the user answered, for prefilling", async () => {
    const { api, calls } = client(
      [ { body: { resource: { answers: { planning: "A wedding", notes: "Outdoor" } } } } ],
      "user-jwt",
    )

    const answers = await api.me.leadAnswers()

    expect(calls[0]?.url).toContain("me/lead_answers")
    expect(calls[0]?.init.method).toBe("GET")
    expect(answers).toEqual({ planning: "A wedding", notes: "Outdoor" })
  })

  it("submits answers keyed by question key", async () => {
    const { api, calls } = client(
      [ { status: 201, body: { resource: { saved: [ "planning", "notes" ] } } } ],
      "user-jwt",
    )

    const receipt = await api.me.submitLeadAnswers({ planning: "A wedding", notes: "Outdoor" })

    expect(calls[0]?.url).toContain("me/lead_answers")
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({
      answers: { planning: "A wedding", notes: "Outdoor" },
    })
    expect(receipt.saved).toEqual([ "planning", "notes" ])
  })

  it("relays the server's verdict when an answer is unacceptable", async () => {
    const { api } = client(
      [ { status: 422, body: { errors: [ "planning: Value is not one of the answers this question offers" ] } } ],
      "user-jwt",
    )

    const error = await failure(api.me.submitLeadAnswers({ planning: "A funeral" }))

    expect(error.isValidationError).toBe(true)
    expect(error.errors[0]).toContain("planning")
  })
})

describe("conversations", () => {
  it("lists the inquiries an owner received", async () => {
    const { api, calls } = client(
      [ { body: { collection: [ {
        id: 7, form_name: "Booking", listing: { slug: "elmau", name: "Schloss Elmau" },
        sender_name: "Alex", answers: [], created_at: "2026-08-14T09:00:00Z",
        conversation_id: null, can_start_conversation: true,
      } ], pagination: { current: 1, pages: 1, count: 1 } } } ],
      "user-jwt",
    )

    const { items } = await api.me.inquiries()

    expect(calls[0]?.url).toContain("me/inquiries")
    expect(items[0]?.can_start_conversation).toBe(true)
  })

  it("answers an inquiry, opening its conversation", async () => {
    const { api, calls } = client(
      [ { status: 201, body: { resource: { id: 3, role: "owner", counterpart: { name: "Alex" },
        listing: { slug: "elmau", name: "Schloss Elmau" }, unread_count: 0, messages_count: 1 } } } ],
      "user-jwt",
    )

    const conversation = await api.me.startConversation(7, "Yes, we have availability.")

    expect(calls[0]?.url).toContain("me/inquiries/7/conversation")
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({
      message: { body: "Yes, we have availability." },
    })
    expect(conversation.role).toBe("owner")
  })

  it("reads the thread and writes a reply", async () => {
    const { api, calls } = client(
      [
        { body: { collection: [ { id: 1, body: "Hello", mine: false, sender: { name: "Owner" } } ],
          pagination: { current: 1, pages: 1, count: 1 } } },
        { status: 201, body: { resource: { id: 2, body: "Hi back", mine: true } } },
      ],
      "user-jwt",
    )

    const { items } = await api.me.conversationMessages(3)
    const reply = await api.me.sendConversationMessage(3, "Hi back")

    expect(calls[0]?.url).toContain("me/conversations/3/messages")
    expect(items[0]?.mine).toBe(false)
    expect(reply.mine).toBe(true)
  })

  it("surfaces a 404 for a conversation the user is no side of", async () => {
    const { api } = client([ { status: 404, body: { errors: [ "Not found." ] } } ], "user-jwt")

    const error = await failure(api.me.conversation(99))

    expect(error.status).toBe(404)
  })
})

describe("articles", () => {
  it("lists published articles with scope and tag filters in the query", async () => {
    const { api, calls } = client([
      { body: { collection: [ { slug: "venue-guide", title: "Venue guide", scope: "blog",
        tags: [ { slug: "venues", name: "Venues" } ] } ],
        pagination: { current: 1, pages: 1, count: 1 } } },
    ])

    const { items } = await api.articles.index({ scope: "blog", tag: "venues", q: "guide" })

    expect(calls[0]?.url).toContain("/articles?")
    expect(calls[0]?.url).toContain("scope=blog")
    expect(calls[0]?.url).toContain("tag=venues")
    expect(items[0]?.tags[0]?.slug).toBe("venues")
  })

  it("reads one article with its markdown and images", async () => {
    const { api, calls } = client([
      { body: { resource: { slug: "venue-guide", title: "Venue guide", scope: "blog",
        content: "# Hello", tags: [], images: [ { filename: "hall.png", url: "https://x/wide", thumb_url: "https://x/thumb" } ] } } },
    ])

    const article = await api.articles.show("venue-guide")

    expect(calls[0]?.url).toContain("/articles/venue-guide")
    expect(article.content).toBe("# Hello")
    expect(article.images[0]?.url).toContain("wide")
  })

  it("surfaces a 404 for a draft", async () => {
    const { api } = client([ { status: 404, body: { errors: [ "Not found." ] } } ])

    const error = await failure(api.articles.show("unfinished"))

    expect(error.status).toBe(404)
  })
})

describe("guest conversations", () => {
  it("reads a guest thread through its link token", async () => {
    const { api, calls } = client([
      { body: { resource: { listing: { slug: "elmau", name: "Schloss Elmau" }, owner_name: "Owner",
        guest_name: "Alex", messages: [ { id: 1, body: "Hello", mine: false, sender_name: "Owner" } ] } } },
    ])

    const thread = await api.guest.conversation("tok123")

    expect(calls[0]?.url).toContain("guest/conversations/tok123")
    expect(thread.messages[0]?.mine).toBe(false)
  })

  it("replies as the guest without a user token", async () => {
    const { api, calls } = client([
      { status: 201, body: { resource: { id: 2, body: "Thanks!", mine: true, sender_name: null } } },
    ])

    const reply = await api.guest.reply("tok123", "Thanks!")

    expect(calls[0]?.url).toContain("guest/conversations/tok123/messages")
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({ message: { body: "Thanks!" } })
    expect(reply.mine).toBe(true)
  })

  it("surfaces a 404 for a dead link", async () => {
    const { api } = client([ { status: 404, body: { errors: [ "Not found." ] } } ])

    const error = await failure(api.guest.conversation("expired"))

    expect(error.status).toBe(404)
  })
})
