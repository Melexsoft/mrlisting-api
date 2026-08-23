import { resource } from "../http.js"
import type {
  CollectionEnvelope,
  Conversation,
  ConversationMessage,
  Envelope,
  GuestConversation,
  GuestMessage,
  Inquiry,
  PageQuery,
  Transport,
} from "../types.js"

export async function inquiries(transport: Transport, query: PageQuery = {}, userToken?: string) {
  const payload = await transport.get<CollectionEnvelope<Inquiry>>("me/inquiries", {
    query: { ...query },
    userToken,
  })

  return { items: payload.collection, pagination: payload.pagination }
}

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

export async function index(transport: Transport, query: PageQuery = {}, userToken?: string) {
  const payload = await transport.get<CollectionEnvelope<Conversation>>("me/conversations", {
    query: { ...query },
    userToken,
  })

  return { items: payload.collection, pagination: payload.pagination }
}

export async function show(transport: Transport, id: number, userToken?: string): Promise<Conversation> {
  return resource(await transport.get<Envelope<Conversation>>(`me/conversations/${id}`, { userToken }))
}

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

export async function showGuest(transport: Transport, token: string): Promise<GuestConversation> {
  return resource(
    await transport.get<Envelope<GuestConversation>>(`guest/conversations/${encodeURIComponent(token)}`),
  )
}

export async function replyAsGuest(
  transport: Transport,
  token: string,
  body: string,
): Promise<GuestMessage> {
  return resource(
    await transport.post<Envelope<GuestMessage>>(`guest/conversations/${encodeURIComponent(token)}/messages`, {
      body: { message: { body } },
    }),
  )
}
