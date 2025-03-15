"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/context/auth-context";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, AlertCircle } from "lucide-react";

// Validation şeması
const formSchema = z.object({
  email: z.string().email({
    message: "Geçerli bir email adresi giriniz.",
  }),
  password: z.string().min(6, {
    message: "Şifre en az 6 karakter olmalıdır.",
  }),
});

// Başarısız giriş denemelerini saymak için localStorage key
const LOGIN_ATTEMPTS_KEY = "login_attempts";
const ACCOUNT_LOCK_UNTIL_KEY = "account_lock_until";

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams?.get("error") || "";
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [countdownTimer, setCountdownTimer] = useState<number | null>(null);

  React.useEffect(() => {
    // URL parametrelerini kontrol et
    const sessionExpired = searchParams.get("session_expired");
    const errorParam = searchParams.get("error");
    
    if (sessionExpired === "true") {
      toast.error("Oturum süreniz doldu, lütfen tekrar giriş yapın.", {
        duration: 5000,
        id: "session-expired"
      });
      console.log("Session expired parameter detected, showing toast");
    }
    
    if (errorParam) {
      toast.error(`Hata: ${errorParam}`, {
        duration: 5000,
        id: "login-error"
      });
    }
  }, [searchParams]);
  
  // Form tanımı
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Hesap kilitli mi kontrol et
  const checkAccountLock = (): number => {
    if (typeof window === "undefined") return 0;
    
    const lockUntilStr = localStorage.getItem(ACCOUNT_LOCK_UNTIL_KEY);
    if (!lockUntilStr) return 0;
    
    const lockUntil = parseInt(lockUntilStr, 10);
    const now = Date.now();
    
    if (lockUntil > now) {
      setLockedUntil(lockUntil);
      const remainingTime = Math.ceil((lockUntil - now) / 1000);
      setCountdownTimer(remainingTime);
      return remainingTime;
    }
    
    // Kilit süresi geçmişse kilidi kaldır
    localStorage.removeItem(ACCOUNT_LOCK_UNTIL_KEY);
    setLockedUntil(null);
    setCountdownTimer(null);
    return 0;
  };

  // Giriş denemelerini kaydet
  const recordLoginAttempt = (success: boolean) => {
    if (typeof window === "undefined") return;
    
    if (success) {
      // Başarılı girişte sayacı sıfırla
      localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
      localStorage.removeItem(ACCOUNT_LOCK_UNTIL_KEY);
      setLockedUntil(null);
      return;
    }
    
    // Başarısız giriş denemesini kaydet
    const attemptsStr = localStorage.getItem(LOGIN_ATTEMPTS_KEY) || "0";
    let attempts = parseInt(attemptsStr, 10);
    attempts += 1;
    
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, attempts.toString());
    
    // 5 başarısız denemeden sonra hesabı kilitle (1 dakika)
    if (attempts >= 5) {
      const lockUntil = Date.now() + 60 * 1000; // 1 dakika
      localStorage.setItem(ACCOUNT_LOCK_UNTIL_KEY, lockUntil.toString());
      setLockedUntil(lockUntil);
      // Başarısız denemeleri sıfırla
      localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
    }
  };
  
  // Countdown timer'ı güncelle
  useEffect(() => {
    const lockRemainingTime = checkAccountLock();
    if (lockRemainingTime > 0) {
      const interval = setInterval(() => {
        setCountdownTimer((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            setLockedUntil(null);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [lockedUntil]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Hesap kilitliyse giriş yapma
    if (checkAccountLock() > 0) {
      return;
    }
    
    setIsSubmitting(true);
    setLoginError(null);
    
    try {
      const result = await login(values.email, values.password);
      
      if (result.success) {
        // Başarılı giriş
        recordLoginAttempt(true);
        toast.success("Giriş başarılı!");
        router.push("/dashboard-all");
      } else {
        // Başarısız giriş
        recordLoginAttempt(false);
        setLoginError(result.error || "Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.");
        toast.error(result.error || "Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.");
      }
    } catch (error) {
      console.error("Login error:", error);
      recordLoginAttempt(false);
      setLoginError("Giriş sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
      toast.error("Giriş sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Kalan süreyi formatlayıp göster
  const formatRemainingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <div className="grid gap-6">
      {searchParams && searchParams.get("session_expired") === "true" && (
        <Alert className="bg-amber-50 text-amber-800 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-800" />
          <AlertDescription>
            Oturum süreniz doldu. Lütfen tekrar giriş yapın.
          </AlertDescription>
        </Alert>
      )}
      
      {loginError && (
        <Alert className="bg-red-50 text-red-800 border-red-200">
          <Info className="h-4 w-4 text-red-800" />
          <AlertDescription>{loginError}</AlertDescription>
        </Alert>
      )}
      
      {lockedUntil && countdownTimer && (
        <Alert className="bg-amber-50 text-amber-800 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-800" />
          <AlertDescription>
            Çok fazla başarısız giriş denemesi. Lütfen {formatRemainingTime(countdownTimer)} sonra tekrar deneyin.
          </AlertDescription>
        </Alert>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="ornek@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Şifre</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || (lockedUntil !== null && lockedUntil > Date.now())}
          >
            {isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
          </Button>
        </form>
      </Form>
    </div>
  );
} 