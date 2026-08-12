import { resource } from "../http.js"
import type { DirectoryUser, Envelope, Session, Transport } from "../types.js"

/**
 * Sign-in for a directory's own frontend users.
 *
 * The returned token identifies one person. Keep it out of localStorage: put it in
 * an httpOnly cookie from your backend, the same way you keep the account token off
 * the client entirely.
 */
export async function login(
  transport: Transport,
  input: { email: string; password: string },
): Promise<Session> {
  const payload = await transport.post<Envelope<DirectoryUser> & { token: string }>("auth/login", {
    body: { user: input },
  })

  return { user: payload.resource, token: payload.token }
}

/** Register a visitor. New accounts are always plain users, never listing owners. */
export async function signup(
  transport: Transport,
  input: { email: string; password: string; password_confirmation?: string; name?: string },
): Promise<Session> {
  const payload = await transport.post<Envelope<DirectoryUser> & { token: string }>("auth/signup", {
    body: { user: { password_confirmation: input.password, ...input } },
  })

  return { user: payload.resource, token: payload.token }
}

/** Signs out everywhere: every token this user holds stops working, not just one. */
export async function logout(transport: Transport, userToken?: string): Promise<void> {
  await transport.delete<void>("auth/logout", { userToken })
}

/** Always succeeds, whether or not the address is registered. */
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

export default { login, signup, logout, requestPasswordReset, resetPassword }
