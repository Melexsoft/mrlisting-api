import { resource } from "../http.js"
import type {
  CollectionEnvelope, Envelope, LeadAnswersReceipt, LeadAnswerValue, LeadQuestion, Transport,
} from "../types.js"

export async function index(transport: Transport): Promise<LeadQuestion[]> {
  const payload = await transport.get<CollectionEnvelope<LeadQuestion>>("lead_questions")

  return payload.collection
}

export async function answers(
  transport: Transport,
  userToken?: string,
): Promise<Record<string, LeadAnswerValue>> {
  const payload = resource(
    await transport.get<Envelope<{ answers: Record<string, LeadAnswerValue> }>>("me/lead_answers", {
      userToken,
    }),
  )

  return payload.answers
}

export async function submitAnswers(
  transport: Transport,
  answers: Record<string, LeadAnswerValue>,
  userToken?: string,
): Promise<LeadAnswersReceipt> {
  return resource(
    await transport.post<Envelope<LeadAnswersReceipt>>("me/lead_answers", {
      body: { answers },
      userToken,
    }),
  )
}
