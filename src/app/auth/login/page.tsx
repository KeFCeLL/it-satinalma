"use client";

import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="container relative flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0 h-[100vh]">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <div className="flex items-center space-x-2">
            <Image
              src="/images/logo.png"
              alt="Green Chemicals Logo"
              width={180}
              height={80}
              className="mr-2"
            />
          </div>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Bu platform, IT satınalma süreçlerinizi daha verimli ve şeffaf bir şekilde yönetmenize yardımcı olur.&rdquo;
            </p>
            <footer className="text-sm">IT Departmanı</footer>
          </blockquote>
        </div>
      </div>
      
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Hesabınıza giriş yapın
            </h1>
            <p className="text-sm text-muted-foreground">
              Giriş bilgilerinizi aşağıya girin
            </p>
          </div>
          <div className="flex justify-center md:hidden">
            <Image
              src="/images/logo.png"
              alt="Green Chemicals Logo"
              width={150}
              height={70}
              className="mb-4"
            />
          </div>
          {/* LoginForm bileşenini Suspense ile sarın */}
          <Suspense fallback={<div className="p-4 text-center">Yükleniyor...</div>}>
            <LoginForm />
          </Suspense>
          <p className="px-8 text-center text-sm text-muted-foreground">
            Devam ederek, şirket{" "}
            <Link
              href="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              kullanım şartlarını
            </Link>{" "}
            ve{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              gizlilik politikasını
            </Link>{" "}
            kabul etmiş olursunuz.
          </p>
        </div>
      </div>
    </div>
  );
} 