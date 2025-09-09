import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      uid: string
      email: string
      name: string
      image: string
      membershipType: 'FREE' | 'PREMIUM' | 'ADMIN'
    } & DefaultSession["user"]
  }

  interface User {
    uid: string
    membershipType?: 'FREE' | 'PREMIUM' | 'ADMIN'
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid: string
    membershipType: 'FREE' | 'PREMIUM' | 'ADMIN'
  }
}
