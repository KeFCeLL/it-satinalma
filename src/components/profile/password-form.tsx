"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { fetchWithAuth } from "@/lib/api";
import { useAuth } from "@/lib/context/auth-context";

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, "Mevcut şifreniz en az 6 karakter olmalıdır"),
  newPassword: z.string().min(8, "Yeni şifreniz en az 8 karakter olmalıdır")
    .regex(/[A-Z]/, "Şifreniz en az bir büyük harf içermelidir")
    .regex(/[a-z]/, "Şifreniz en az bir küçük harf içermelidir")
    .regex(/[0-9]/, "Şifreniz en az bir sayı içermelidir"),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export function PasswordForm() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Form gönderildiğinde
  const onSubmit = async (values: PasswordFormValues) => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Şifre değiştirme işlemi için API'ye istek gönder
      const response = await fetchWithAuth(`/api/kullanicilar/${user.id}/sifre-degistir`, {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Şifre değiştirme sırasında bir hata oluştu");
      }

      // Formu sıfırla
      form.reset();
      toast.success("Şifreniz başarıyla değiştirildi");
    } catch (error: any) {
      console.error("Şifre değiştirme hatası:", error);
      toast.error(error.message || "Şifre değiştirilirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mevcut Şifre</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Mevcut şifrenizi girin"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Yeni Şifre</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Yeni şifrenizi girin"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Şifreniz en az 8 karakter uzunluğunda olmalı ve en az bir büyük harf, bir küçük harf ve bir sayı içermelidir.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Şifre Onay</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Yeni şifrenizi tekrar girin"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
        </Button>
      </form>
    </Form>
  );
} 