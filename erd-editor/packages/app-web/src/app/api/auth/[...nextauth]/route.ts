import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/models/User"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  cookies: {
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    state: {
      name: "next-auth.state",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account || !user.email) return false;

      try {
        await connectDB();

        // 기존 사용자 확인
        const existingUser = await User.findOne({
          $or: [
            { email: user.email },
            { provider: account.provider, providerId: account.providerAccountId }
          ]
        });

        // 새 사용자(회원가입)인 경우에만 MongoDB에 저장
        if (!existingUser) {
          const newUser = await User.create({
            email: user.email,
            name: user.name || user.email.split('@')[0],
            image: user.image,
            provider: account.provider,
            providerId: account.providerAccountId,
            membershipType: 'FREE'
          });

          console.log('새 사용자 회원가입:', newUser.email);
        } else {
          console.log('기존 사용자 로그인:', existingUser.email);
        }
      } catch (error) {
        console.error('인증 처리 중 오류:', error);
        // MongoDB 오류가 있어도 로그인은 허용
        console.log('MongoDB 오류 무시하고 로그인 허용:', user.email);
      }

      return true;
    },
    async jwt({ token, account, user, trigger, session }) {
      if (account && user) {
        // MongoDB에서 사용자 정보 가져오기
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: user.email });
          
          if (dbUser) {
            token.uid = dbUser._id.toString()
            token.email = dbUser.email
            token.name = dbUser.name
            token.picture = dbUser.image
            token.membershipType = dbUser.membershipType
          }
        } catch (error) {
          console.error('DB에서 사용자 정보 가져오기 오류:', error);
          // fallback to OAuth data
          token.uid = user.id
          token.email = user.email
          token.name = user.name
          token.picture = user.image
          token.membershipType = 'FREE'
        }
      }

      // 세션이 업데이트될 때마다 DB에서 최신 정보를 가져옴
      if (trigger === 'update' && token.email) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: token.email });
          
          if (dbUser) {
            token.name = dbUser.name
            token.picture = dbUser.image
            token.membershipType = dbUser.membershipType
          }
        } catch (error) {
          console.error('세션 업데이트 중 DB 조회 오류:', error);
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.uid = token.uid as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
        session.user.membershipType = token.membershipType as 'FREE' | 'PREMIUM' | 'ADMIN'
      }
      
      return session
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
