'use server'

import { signIn } from '@/lib/auth'
import { AuthError } from 'next-auth'

export async function loginAction(email: string, password: string): Promise<string | undefined> {
  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/',
    })
  } catch (error: any) {
    if (error instanceof AuthError) {
      // Show the root cause of CallbackRouteError
      const cause: any = error.cause?.err || error.cause || error
      return `[${error.type}] cause: ${cause?.message || String(cause)} | stack: ${String(cause?.stack || '').substring(0, 300)}`
    }
    // Re-throw non-AuthError (including NEXT_REDIRECT on success)
    throw error
  }
}
