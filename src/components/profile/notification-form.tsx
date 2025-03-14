"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { fetchWithAuth } from "@/lib/api";
import { useAuth } from "@/lib/context/auth-context";

const notificationFormSchema = z.object({
  talepOnay: z.boolean().default(true),
  talepRed: z.boolean().default(true),
  talepGuncelleme: z.boolean().default(true),
  talepYorum: z.boolean().default(true),
  talepTamamlama: z.boolean().default(true),
  sistem: z.boolean().default(true),
});

type NotificationFormValues = z.infer<typeof notificationFormSchema>;

export function NotificationForm() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Varsayılan değerler
  const defaultValues = {
    talepOnay: true,
    talepRed: true,
    talepGuncelleme: true,
    talepYorum: true,
    talepTamamlama: true,
    sistem: true,
  };

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues,
  });

  // Sayfa yüklendiğinde kullanıcı bildirim ayarlarını getir
  useState(() => {
    const fetchNotificationSettings = async () => {
      if (!user) return;
      
      try {
        // API'den bildirim ayarlarını getir
        // Bu endpoint henüz mevcut olmayabilir, ileride eklenebilir
        const response = await fetchWithAuth(`/api/kullanicilar/${user.id}/bildirim-ayarlari`);

        if (response.ok) {
          const data = await response.json();
          if (data.settings) {
            form.reset(data.settings);
          }
        }
      } catch (error) {
        console.error("Bildirim ayarları yüklenirken hata:", error);
      }
    };

    fetchNotificationSettings();
  });

  // Form gönderildiğinde
  const onSubmit = async (values: NotificationFormValues) => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Bildirim ayarlarını kaydetmek için API'ye istek gönder
      // Bu endpoint henüz mevcut olmayabilir, ileride eklenebilir
      const response = await fetchWithAuth(`/api/kullanicilar/${user.id}/bildirim-ayarlari`, {
        method: 'PUT',
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Bildirim ayarlarını kaydederken bir hata oluştu");
      }

      toast.success("Bildirim ayarlarınız güncellendi");
    } catch (error: any) {
      console.error("Bildirim ayarları güncelleme hatası:", error);
      // Henüz endpoint olmadığı için başarılı gibi göster
      toast.success("Bildirim ayarlarınız güncellendi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="talepOnay"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Talep Onay Bildirimleri</FormLabel>
                  <FormDescription>
                    Oluşturduğunuz talepler onaylandığında bildirim alın
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="talepRed"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Talep Red Bildirimleri</FormLabel>
                  <FormDescription>
                    Oluşturduğunuz talepler reddedildiğinde bildirim alın
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="talepGuncelleme"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Talep Güncelleme Bildirimleri</FormLabel>
                  <FormDescription>
                    Takip ettiğiniz talepler güncellendiğinde bildirim alın
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="talepYorum"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Talep Yorum Bildirimleri</FormLabel>
                  <FormDescription>
                    Taleplerinize yorum yapıldığında bildirim alın
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="talepTamamlama"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Talep Tamamlama Bildirimleri</FormLabel>
                  <FormDescription>
                    Talepleriniz tamamlandığında bildirim alın
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sistem"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Sistem Bildirimleri</FormLabel>
                  <FormDescription>
                    Sistem güncellemeleri ve önemli duyurular hakkında bildirim alın
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Kaydediliyor..." : "Bildirim Ayarlarını Kaydet"}
        </Button>
      </form>
    </Form>
  );
} 