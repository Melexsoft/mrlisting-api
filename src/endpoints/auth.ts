import { resource } from "../http.js"
import type { DirectoryUser, Envelope, Session, Transport } from "../types.js"

export async function login(
  transport: Transport,
  input: { email: string; password: string },
): Promise<Session> {
  const payload = await transport.post<Envelope<DirectoryUser> & { token: string }>("auth/login", {
    body: { user: input },
  })

  return { user: payload.resource, token: payload.token }
}

export async function signup(
  transport: Transport,
  input: { email: string; password: string; password_confirmation?: string; name?: string },
): Promise<Session> {
  const payload = await transport.post<Envelope<DirectoryUser> & { token: string }>("auth/signup", {
    body: { user: { password_confirmation: input.password, ...input } },
  })

  return { user: payload.resource, token: payload.token }
}

export async function logout(transport: Transport, userToken?: string): Promise<void> {
  await transport.delete<void>("auth/logout", { userToken })
}

export async function requestPasswordReset(
  transport: Transport,
  email: string,
): Promise<{ message: string }> {
  return resource(
    await transport.post<Envelope<{ message: string }>>("auth/password", { body: { user: { email } } }),
  )
}

export async function resetPassword(
  transport: Transport,
  input: { reset_password_token: string; password: string; password_confirmation?: string },
): Promise<DirectoryUser> {
  return resource(
    await transport.put<Envelope<DirectoryUser>>("auth/password", {
      body: { user: { password_confirmation: input.password, ...input } },
    }),
  )
}
