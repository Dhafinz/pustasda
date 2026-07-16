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
  } catch (error) {
    if (error instanceof AuthError) {
      // Temporarily return detailed error info for debugging
      return `Auth Error [${error.type}]: ${error.message?.substring(0, 200)}`
    }
    // Re-throw non-AuthError (including NEXT_REDIRECT on success)
    throw error
  }
}
