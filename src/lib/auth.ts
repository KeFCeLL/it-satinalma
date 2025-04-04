import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from './prisma';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email ve şifre gereklidir');
        }

        const kullanici = await prisma.kullanici.findUnique({
          where: { email: credentials.email },
          include: {
            departman: {
              select: {
                id: true,
                ad: true,
              },
            },
          },
        });

        if (!kullanici) {
          throw new Error('Kullanıcı bulunamadı');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, kullanici.sifre);

        if (!isPasswordValid) {
          throw new Error('Geçersiz şifre');
        }

        return {
          id: kullanici.id,
          email: kullanici.email,
          name: `${kullanici.ad} ${kullanici.soyad}`,
          role: kullanici.rol as Role,
          departmanId: kullanici.departmanId,
          departman: kullanici.departman,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.departmanId = user.departmanId;
        token.departman = user.departman;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.departmanId = token.departmanId;
        session.user.departman = token.departman;
      }
      return session;
    },
  },
  pages: {
    signIn: '/giris',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 