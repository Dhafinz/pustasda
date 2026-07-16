'use server'

import { signIn } from '@/lib/auth'
import { AuthError } from 'next-auth'

export async function loginAction(email: string, password: string) {
  try {
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    return { success: true }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { success: false, error: 'Email atau password salah. Silakan coba lagi.' }
        default:
          return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' }
      }
    }
    // IMPORTANT: NextAuth v5 throws a NEXT_REDIRECT "error" on successful signIn
    // when redirect is not explicitly false on server side. We need to re-throw it.
    throw error
  }
}
