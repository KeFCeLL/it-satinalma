"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/context/auth-context";
import { updateUser } from "@/lib/services/user-service";
import { getDepartmentOptions } from "@/lib/services/department-service";

const profileFormSchema = z.object({
  ad: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
  soyad: z.string().min(2, "Soyad en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  departmanId: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm() {
  const { user, updateUser: updateAuthUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [departmanlar, setDepartmanlar] = useState<{ id: string; ad: string }[]>([]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      ad: user?.ad || "",
      soyad: user?.soyad || "",
      email: user?.email || "",
      departmanId: user?.departmanId || "",
    },
  });

  // Sayfa yüklendiğinde departmanları getir
  useState(() => {
    const fetchDepartments = async () => {
      try {
        const { departmanlar } = await getDepartmentOptions();
        setDepartmanlar(departmanlar);
      } catch (error) {
        console.error("Departmanlar yüklenirken hata:", error);
        toast.error("Departmanlar yüklenemedi");
      }
    };
    fetchDepartments();
  });

  // Form gönderildiğinde
  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Kullanıcı bilgilerini güncelle
      const { user: updatedUser } = await updateUser(user.id, {
        ad: values.ad,
        soyad: values.soyad,
        email: values.email,
        departmanId: values.departmanId,
      });

      // Context'teki kullanıcı bilgilerini güncelle
      updateAuthUser({
        ...user,
        ad: updatedUser.ad,
        soyad: updatedUser.soyad,
        email: updatedUser.email,
        departmanId: updatedUser.departmanId,
        departman: updatedUser.departman,
      });

      toast.success("Profil bilgileriniz güncellendi");
    } catch (error) {
      console.error("Profil güncelleme hatası:", error);
      toast.error("Profil bilgileriniz güncellenirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ad */}
          <FormField
            control={form.control}
            name="ad"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ad</FormLabel>
                <FormControl>
                  <Input placeholder="Adınız" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Soyad */}
          <FormField
            control={form.control}
            name="soyad"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Soyad</FormLabel>
                <FormControl>
                  <Input placeholder="Soyadınız" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-posta</FormLabel>
                <FormControl>
                  <Input placeholder="E-posta adresiniz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Departman */}
          {(user?.rol !== "ADMIN" && user?.rol !== "IT_ADMIN") && (
            <FormField
              control={form.control}
              name="departmanId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departman</FormLabel>
                  <Select
                    disabled
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Departman seçiniz" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departmanlar.map((departman) => (
                        <SelectItem
                          key={departman.id}
                          value={departman.id}
                        >
                          {departman.ad}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Departman değişiklikleri yöneticiniz tarafından yapılabilir.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
        </Button>
      </form>
    </Form>
  );
} 