"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { User } from "@/lib/services/user-service";

// Form şeması
const formSchema = z.object({
  ad: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
  soyad: z.string().min(2, "Soyad en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  rol: z.string(),
  departmanId: z.string().optional(),
  durum: z.enum(["AKTIF", "PASIF"]),
});

// Bileşen props tanımı
interface KullaniciDuzenleProps {
  user: User & { durum?: 'AKTIF' | 'PASIF' };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Departman tipi
interface Department {
  id: string;
  ad: string;
  aciklama?: string;
  createdAt: string;
  updatedAt: string;
}

export function KullaniciDuzenle({ user, open, onOpenChange, onSuccess }: KullaniciDuzenleProps) {
  const [loading, setLoading] = useState(false);
  const [departmanlar, setDepartmanlar] = useState<Department[]>([]);

  // Form oluştur
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ad: user.ad || "",
      soyad: user.soyad || "",
      email: user.email || "",
      rol: user.rol || "KULLANICI",
      departmanId: user.departmanId || "",
      durum: user.durum || "AKTIF",
    },
  });

  // Departmanları yükle
  useEffect(() => {
    const fetchDepartmanlar = async () => {
      try {
        const response = await fetch('/api/departmanlar?hepsi=true', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Departmanlar alınırken hata: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.departmanlar) {
          setDepartmanlar(data.departmanlar);
        } else if (data.data) {
          setDepartmanlar(data.data);
        }
      } catch (error: any) {
        console.error("Departmanlar yüklenirken hata:", error);
        toast.error(`Departmanlar yüklenirken hata oluştu: ${error.message}`);
      }
    };

    fetchDepartmanlar();
  }, []);

  // Form gönderildiğinde
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      // Geçici çözüm: Her istekte mock API modunu devre dışı bırak
      localStorage.setItem('useMockApi', 'false');
      
      console.log("📝 Kullanıcı güncelleme isteği gönderiliyor:", values);
      
      // API çağrısı
      const response = await fetch(`/api/kullanicilar/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'X-Force-No-Mock': 'true'
        },
        body: JSON.stringify(values),
        credentials: 'include'
      });

      // Detaylı loglama
      console.log("📊 API yanıtı detayları:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url
      });
      
      let responseData;
      try {
        const responseText = await response.text();
        console.log("📋 API yanıtı (raw):", responseText);
        
        try {
          responseData = JSON.parse(responseText);
          console.log("📋 API yanıtı (parsed):", responseData);
        } catch (parseError) {
          console.error("JSON parse hatası:", parseError);
          throw new Error(`Sunucudan geçersiz JSON yanıtı: ${responseText.substring(0, 100)}...`);
        }
      } catch (error) {
        console.error("API yanıtı okuma hatası:", error);
        throw new Error("Sunucudan yanıt alınamadı");
      }
      
      if (!response.ok) {
        const errorMessage = responseData?.error || responseData?.message || `Sunucu hatası: ${response.status} ${response.statusText}`;
        console.error("❌ API hatası:", {
          status: response.status,
          message: errorMessage,
          data: responseData
        });
        throw new Error(errorMessage);
      }

      // Başarılı yanıt
      toast.success(`${values.ad} ${values.soyad} kullanıcısı başarıyla güncellendi!`);
      
      // LocalStorage'ı güncelle
      try {
        const savedUsers = localStorage.getItem('it_satinalma_users');
        if (savedUsers) {
          const users = JSON.parse(savedUsers);
          const updatedUsers = users.map((u: any) => 
            u.id === user.id ? responseData.kullanici : u
          );
          localStorage.setItem('it_satinalma_users', JSON.stringify(updatedUsers));
        }
      } catch (storageError) {
        console.error('LocalStorage güncelleme hatası:', storageError);
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
      onOpenChange(false);
    } catch (error: any) {
      console.error("Kullanıcı güncelleme hatası:", error);
      toast.error(`Kullanıcı güncellenirken hata oluştu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Kullanıcı Düzenle</DialogTitle>
          <DialogDescription>
            {user.ad} {user.soyad} kullanıcısının bilgilerini düzenleyin
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ad</FormLabel>
                    <FormControl>
                      <Input placeholder="Ad" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="soyad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Soyad</FormLabel>
                    <FormControl>
                      <Input placeholder="Soyad" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-posta</FormLabel>
                    <FormControl>
                      <Input placeholder="E-posta" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="rol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Rol seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ADMIN">Sistem Yöneticisi</SelectItem>
                        <SelectItem value="SATINALMA_ADMIN">Satınalma Yöneticisi</SelectItem>
                        <SelectItem value="IT_ADMIN">IT Yöneticisi</SelectItem>
                        <SelectItem value="FINANS_ADMIN">Finans Yöneticisi</SelectItem>
                        <SelectItem value="DEPARTMAN_YONETICISI">Departman Yöneticisi</SelectItem>
                        <SelectItem value="KULLANICI">Standart Kullanıcı</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="departmanId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departman</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Departman seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departmanlar.map((departman) => (
                          <SelectItem key={departman.id} value={departman.id}>
                            {departman.ad}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="durum"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durum</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Durum seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="AKTIF">Aktif</SelectItem>
                        <SelectItem value="PASIF">Pasif</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kaydet
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 