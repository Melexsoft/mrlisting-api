import { resource } from "../http.js"
import type {
  CollectionEnvelope, Envelope, LeadAnswersReceipt, LeadAnswerValue, LeadQuestion, Transport,
} from "../types.js"

/**
 * The questions this directory asks right after signup, in order. Render what
 * you are told; the server decides what it accepts when the answers come back.
 */
export async function index(transport: Transport): Promise<LeadQuestion[]> {
  const payload = await transport.get<CollectionEnvelope<LeadQuestion>>("lead_questions")

  return payload.collection
}

/**
 * What the signed-in user has answered so far, keyed by question key — for
 * prefilling the form or skipping questions that are already answered.
 */
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

/**
 * Store the signed-in user's answers, keyed by question key. All-or-nothing:
 * either every answer is acceptable, or nothing is stored. Answering again
 * overwrites, so re-submitting is safe.
 */
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

export default { index, answers, submitAnswers }
