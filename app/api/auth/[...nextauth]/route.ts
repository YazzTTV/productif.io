import NextAuth from "next-auth";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { createToken, createSession } from "@/lib/auth";

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
        let dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        // Si l'utilisateur n'existe pas, le créer
        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || "Utilisateur Google",
              password: "", // Pas de mot de passe pour les utilisateurs Google
            },
          });
        }

        // Créer un token JWT et une session avec le système d'auth personnalisé
        const token = await createToken({
          userId: dbUser.id,
          email: dbUser.email,
        });

        await createSession(dbUser.id, token);

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
    async redirect({ url, baseUrl }) {
      // Forcer l'utilisation du domaine personnalisé en production
      const productionBaseUrl = 'https://www.productif.io';
      const effectiveBaseUrl = process.env.NODE_ENV === 'production' 
        ? productionBaseUrl 
        : baseUrl;
      
      // Rediriger vers la page de callback qui créera les cookies personnalisés
      // Passer l'URL de destination dans les paramètres
      let callbackUrl = "/dashboard"
      
      // Si une URL est fournie, l'utiliser comme destination finale
      if (url.startsWith("/") && url !== "/") {
        callbackUrl = url
      } else if (url.startsWith(baseUrl)) {
        callbackUrl = url.replace(baseUrl, "")
      } else if (url.startsWith(productionBaseUrl)) {
        callbackUrl = url.replace(productionBaseUrl, "")
      }
      
      // Construire l'URL de callback avec le domaine personnalisé en production
      const callbackPath = `/auth/callback?callbackUrl=${encodeURIComponent(callbackUrl)}`;
      
      if (process.env.NODE_ENV === 'production') {
        return `${productionBaseUrl}${callbackPath}`;
      }
      
      return callbackPath;
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

export { handler as GET, handler as POST, authOptions }; 