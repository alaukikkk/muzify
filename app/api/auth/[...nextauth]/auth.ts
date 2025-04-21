import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prismaClient } from "@/app/lib/db";  // Import Prisma client

export const authOptions = {
  // Define the authentication providers (e.g., credentials, Google, etc.)
  providers: [
    // Credentials provider: allows authentication using email and password
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Authenticate user using Prisma or any other method (e.g., database lookup)
        const user = await prismaClient.user.findUnique({
          where: { email: credentials?.email },
        });

        if (user && user.password === credentials?.password) {
          return user; // Return user data if authentication is successful
        }

        return null; // Return null if authentication fails
      },
    }),
  ],

  // Use Prisma adapter to integrate NextAuth with your Prisma schema
  adapter: PrismaAdapter(prismaClient),

  // Session strategy (JWT for stateless authentication or database-backed sessions)
  session: {
    strategy: "jwt", // Use JWT tokens for session management
  },

  // Define callbacks for handling JWT tokens and session data
  callbacks: {
    async jwt({ token, user }) {
      // Add user data to JWT token when a user logs in
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token; // Return the modified token
    },
    async session({ session, token }) {
      // Attach token data (user information) to the session
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
      }
      return session; // Return the modified session
    },
  },

  // Optional: Set a secret for encrypting JWT tokens
  secret: process.env.NEXTAUTH_SECRET,

  // Optional: Customize pages (e.g., login page)
  pages: {
    signIn: "/auth/signin", // Redirect to a custom login page if needed
    error: "/auth/error", // Custom error page if needed
  },

  // Optional: Configure the theme and styling of the auth pages
  theme: {
    colorScheme: "light", // Choose between "light" and "dark" themes
  },
};

// Default export for NextAuth.js
export default NextAuth(authOptions);
