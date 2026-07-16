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
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Email atau password salah. Silakan coba lagi.'
        default:
          return 'Terjadi kesalahan autentikasi. Silakan coba lagi.'
      }
    }
    // Re-throw non-AuthError (including NEXT_REDIRECT on success)
    // Next.js framework catches this and performs the redirect
    throw error
  }
}
