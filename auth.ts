import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

// How long a token's cached name/roles may be reused before being re-read.
const REFRESH_INTERVAL_MS = 5 * 60 * 1000

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma as any),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials")
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
          },
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        })

        if (!user || !user.password) {
          throw new Error("Invalid credentials")
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error("Invalid credentials")
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
          roles: user.roles.map((ur) => ur.role.code),
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On login, merge user info into token
      if (user) {
        token.id = user.id
        token.roles = user.roles
        token.name = user.name
        token.email = user.email
        token.image = user.image
        token.refreshedAt = Date.now()
      }

      // This callback runs on every request that evaluates the session, which
      // for a signed-in visitor means every page view and every poll. Refetching
      // the user and their roles each time made a database round trip the price
      // of simply being logged in. Refresh on an explicit session update, or
      // once the cached copy is older than REFRESH_INTERVAL_MS, so a role or
      // profile change still lands promptly without querying on every request.
      const refreshedAt = typeof token.refreshedAt === 'number' ? token.refreshedAt : 0
      const isStale = Date.now() - refreshedAt > REFRESH_INTERVAL_MS

      if (token.id && (trigger === 'update' || isStale)) {
        const userId = typeof token.id === 'string' ? parseInt(token.id) : Number(token.id)
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            roles: { include: { role: true } },
          },
        })
        if (dbUser) {
          token.name = dbUser.name
          token.email = dbUser.email
          token.image = dbUser.image
          token.roles = dbUser.roles.map((ur) => ur.role.code)
        }
        token.refreshedAt = Date.now()
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.roles = token.roles as string[]
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.image = token.image as string | null
      }
      return session
    },
  },
})
