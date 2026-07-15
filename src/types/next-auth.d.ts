import 'next-auth'

declare module 'next-auth' {
  interface User {
    role?: string
    photo?: string | null
  }
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: string
      photo: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    photo: string | null
  }
}
