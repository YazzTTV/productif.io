import NextAuth from "next-auth";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || !profile || !user.email) {
        return false;
      }

      try {
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        // Si l'utilisateur n'existe pas, le créer
        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || "Utilisateur Google",
              password: "", // Pas de mot de passe pour les utilisateurs Google
            },
          });
        }

        // Stocker les tokens de Google
        if (existingUser && account.access_token) {
          await prisma.session.create({
            data: {
              userId: existingUser.id,
              token: account.access_token,
              expiresAt: new Date(Date.now() + 3600 * 1000), // 1 heure
            },
          });
        }

        return true;
      } catch (error) {
        console.error("Erreur lors de la connexion:", error);
        return false;
      }
    },
    async jwt({ token, account }) {
      // Ajouter le jeton d'accès au token JWT lors de la première connexion
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Ajouter le jeton d'accès à la session
      session.accessToken = token.accessToken;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 