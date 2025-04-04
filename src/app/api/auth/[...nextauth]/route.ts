import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcrypt';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    role: Role;
    departmanId: string;
    departmanAd: string;
  }

  interface Session {
    user: User & {
      role: Role;
      departmanId: string;
      departmanAd: string;
    };
  }
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Şifre", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email ve şifre gereklidir');
        }

        const user = await prisma.kullanici.findUnique({
          where: {
            email: credentials.email,
          },
          include: {
            departman: true,
          },
        });

        if (!user) {
          throw new Error('Kullanıcı bulunamadı');
        }

        const isPasswordValid = await compare(credentials.password, user.sifre);

        if (!isPasswordValid) {
          throw new Error('Geçersiz şifre');
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.ad} ${user.soyad}`,
          role: user.rol,
          departmanId: user.departmanId,
          departmanAd: user.departman.ad,
        };
      }
    })
  ],
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.departmanId = user.departmanId;
        token.departmanAd = user.departmanAd;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as Role;
        session.user.departmanId = token.departmanId as string;
        session.user.departmanAd = token.departmanAd as string;
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt',
  },
});

export { handler as GET, handler as POST }; 