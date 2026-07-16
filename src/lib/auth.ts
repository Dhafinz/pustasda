import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from './prisma'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.isActive) return null

        const isValid = await compare(credentials.password as string, user.password)
        if (!isValid) return null

        // Log activity (non-blocking — don't let logging failure block login)
        try {
          await prisma.activityLog.create({
            data: {
              userId: user.id,
              action: 'login',
              module: 'auth',
              description: `User ${user.name} logged in`,
            },
          })
        } catch {
          // Silently ignore logging errors
        }

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
          photo: user.photo,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.photo = (user as any).photo
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.photo = token.photo as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET,
})
