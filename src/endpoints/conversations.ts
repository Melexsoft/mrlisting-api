import { resource } from "../http.js"
import type {
  CollectionEnvelope,
  Conversation,
  ConversationMessage,
  Envelope,
  Inquiry,
  PageQuery,
  Transport,
} from "../types.js"

/**
 * Inquiries received for the signed-in owner's entries, newest first.
 *
 * The doorway into conversations: an inquiry whose sender was signed in
 * (`can_start_conversation`) can be answered in-app; the rest can only be
 * answered by email.
 */
export async function inquiries(transport: Transport, query: PageQuery = {}, userToken?: string) {
  const payload = await transport.get<CollectionEnvelope<Inquiry>>("me/inquiries", {
    query: { ...query },
    userToken,
  })

  return { items: payload.collection, pagination: payload.pagination }
}

/**
 * Answer an inquiry: opens the conversation growing out of it — or reuses the
 * existing one — and posts the message in one step.
 */
export async function startFromInquiry(
  transport: Transport,
  inquiryId: number,
  body: string,
  userToken?: string,
): Promise<Conversation> {
  return resource(
    await transport.post<Envelope<Conversation>>(`me/inquiries/${inquiryId}/conversation`, {
      body: { message: { body } },
      userToken,
    }),
  )
}

/** The signed-in user's conversations, most recently active first. */
export async function index(transport: Transport, query: PageQuery = {}, userToken?: string) {
  const payload = await transport.get<CollectionEnvelope<Conversation>>("me/conversations", {
    query: { ...query },
    userToken,
  })

  return { items: payload.collection, pagination: payload.pagination }
}

/** One conversation — 404 unless the signed-in user is a participant. */
export async function show(transport: Transport, id: number, userToken?: string): Promise<Conversation> {
  return resource(await transport.get<Envelope<Conversation>>(`me/conversations/${id}`, { userToken }))
}

/**
 * The message thread, oldest first. Reading it moves the signed-in user's read
 * marker, so the conversation's unread_count drops to zero.
 */
export async function messages(
  transport: Transport,
  id: number,
  query: PageQuery = {},
  userToken?: string,
) {
  const payload = await transport.get<CollectionEnvelope<ConversationMessage>>(
    `me/conversations/${id}/messages`,
    { query: { ...query }, userToken },
  )

  return { items: payload.collection, pagination: payload.pagination }
}

/** Write a message. The other side is notified by email; the sender never is. */
export async function sendMessage(
  transport: Transport,
  id: number,
  body: string,
  userToken?: string,
): Promise<ConversationMessage> {
  return resource(
    await transport.post<Envelope<ConversationMessage>>(`me/conversations/${id}/messages`, {
      body: { message: { body } },
      userToken,
    }),
  )
}

export default { inquiries, startFromInquiry, index, show, messages, sendMessage }
