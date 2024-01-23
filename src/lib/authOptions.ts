import { UpstashRedisAdapter } from "@next-auth/upstash-redis-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { db } from "@/lib/db";
import { getGoogleCredentials } from "./utils";
import { fetchRedis } from "@/helpers/redis";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  adapter: UpstashRedisAdapter(db),
  pages: {
    signIn: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: getGoogleCredentials().clientId,
      clientSecret: getGoogleCredentials().clientSecret,
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      const dbUserResult = (await fetchRedis("get", `user:${token.id}`)) as string | null; 

      if (!dbUserResult) {
        if (user) {
          token.id = user!.id
        }

        return token
      }

      const dbUser = JSON.parse(dbUserResult) as User

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.image,
      }

    },
    async session({ session, token }) {

      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
      }

      return session;
    },
    redirect() {
      return "/dashboard";
    }
  }
};
