"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Department } from "@/lib/services/department-service";
import { fetchWithoutCache } from "@/lib/api-config";

// Form doğrulama şeması
const formSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  sifre: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  ad: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
  soyad: z.string().min(2, "Soyad en az 2 karakter olmalıdır"),
  rol: z.string().min(1, "Rol seçimi zorunludur"),
  departmanId: z.string().optional(),
});

// Bileşen props
interface KullaniciEkleProps {
  onSuccess: () => void;
}

export function KullaniciEkle({ onSuccess }: KullaniciEkleProps) {
  const [loading, setLoading] = useState(false);
  const [departmanlar, setDepartmanlar] = useState<Department[]>([]);
  const router = useRouter();
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // Form oluştur
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      sifre: "",
      ad: "",
      soyad: "",
      rol: "",
      departmanId: "",
    },
  });

  useEffect(() => {
    console.log("Form değerlerini izle:", form.getValues());
  }, [form.formState.isDirty]); // Form değerleri değiştiğinde loglama

  // Sayfa yüklendiğinde departmanları getir
  useEffect(() => {
    fetchDepartmanlar();
  }, []);

  // Departmanları getir
  async function fetchDepartmanlar() {
    setLoadingDepartments(true);

    try {
      // Geçici çözüm: Mock API modunu devre dışı bırak
      localStorage.setItem('useMockApi', 'false');
      
      console.log('🔄 [KullaniciEkle] Departmanlar yükleniyor...');
      
      // Yerel depolamadaki departmanları kontrol et
      const localStorageDepartments = localStorage.getItem('it_satinalma_departments');
      if (localStorageDepartments) {
        try {
          const parsedDepts = JSON.parse(localStorageDepartments);
          console.log('📦 [KullaniciEkle] LocalStorage\'dan departmanlar yüklendi:', parsedDepts.length);
          
          if (Array.isArray(parsedDepts) && parsedDepts.length > 0) {
            setDepartmanlar(parsedDepts);
            // API'den güncel veriyi getirmeye devam et
          }
        } catch (error) {
          console.error('LocalStorage parse hatası:', error);
        }
      }
      
      // API isteği
      const response = await fetchWithoutCache('/api/departmanlar?hepsi=true');
      console.log('📊 [KullaniciEkle] Departmanlar API yanıtı:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('📋 [KullaniciEkle] Departmanlar veri:', data);
      
      // Debug için API yanıtını sakla
      try {
        localStorage.setItem('debug_last_departments_response', JSON.stringify({
          timestamp: new Date().toISOString(),
          status: response.status,
          statusText: response.statusText,
          data
        }));
      } catch (error) {
        console.error('Debug veri kaydetme hatası:', error);
      }
      
      if (data.success && data.departmanlar && Array.isArray(data.departmanlar)) {
        setDepartmanlar(data.departmanlar);
        
        // LocalStorage'a kaydet
        localStorage.setItem('it_satinalma_departments', JSON.stringify(data.departmanlar));
      } else if (data.data && Array.isArray(data.data)) {
        setDepartmanlar(data.data);
        
        // LocalStorage'a kaydet
        localStorage.setItem('it_satinalma_departments', JSON.stringify(data.data));
      } else {
        toast.error("Departman verileri getirilirken beklenmeyen yanıt formatı");
        console.error("Geçersiz departman veri formatı:", data);
      }
    } catch (error: any) {
      console.error("Departmanlar yüklenirken hata:", error);
      toast.error(`Departmanlar yüklenirken hata: ${error.message}`);
    } finally {
      setLoadingDepartments(false);
    }
  }

  // Form gönderildiğinde
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      // Geçici çözüm: Her istekte mock API modunu devre dışı bırak
      localStorage.setItem('useMockApi', 'false');
      
      // Departman ID'si boş string ise null olarak ayarla
      const formData = {
        ...values,
        departmanId: values.departmanId && values.departmanId.trim() !== "" ? values.departmanId : null,
        role: values.rol // rol değerini role olarak gönderiyoruz
      };
      
      console.log("📝 Kullanıcı oluşturma isteği gönderiliyor:", formData);
      
      // API endpoint'ini kontrol et
      const apiUrl = '/api/kullanicilar';
      console.log("🌐 API URL:", apiUrl);
      
      // API çağrısı
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'X-Force-No-Mock': 'true'
        },
        body: JSON.stringify(formData),
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

      // API yanıtı başarılı ise LocalStorage'ı güncelle
      if (responseData?.kullanici) {
        try {
          const savedUsers = localStorage.getItem('it_satinalma_users');
          let users = [];
          
          if (savedUsers) {
            try {
              users = JSON.parse(savedUsers);
              console.log("📦 Mevcut kullanıcılar:", users.length);
            } catch (parseError) {
              console.error("LocalStorage parse hatası:", parseError);
              users = [];
            }
          }
          
          // API'den dönen gerçek kullanıcıyı ekle
          users.push(responseData.kullanici);
          
          // LocalStorage'a kaydet
          localStorage.setItem('it_satinalma_users', JSON.stringify(users));
          console.log('✅ Kullanıcı başarıyla kaydedildi:', responseData.kullanici);
          
          // Formu sıfırla
          form.reset();
          
          // Başarı mesajı göster
          toast.success("Kullanıcı başarıyla eklendi");
          
          // Callback'i çağır
          onSuccess();
        } catch (storageError) {
          console.error('LocalStorage kaydetme hatası:', storageError);
          toast.error("Kullanıcı kaydedildi ancak yerel depolama güncellenemedi");
        }
      } else {
        console.error("Geçersiz API yanıtı:", responseData);
        throw new Error("Sunucudan geçersiz kullanıcı verisi alındı");
      }
    } catch (error: any) {
      console.error("Kullanıcı ekleme hatası:", error);
      toast.error(error.message || "Kullanıcı eklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Şifre oluştur
  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    form.setValue("sifre", password);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <Input placeholder="E-posta adresi" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="sifre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şifre</FormLabel>
                    <div className="flex space-x-2">
                      <FormControl>
                        <Input placeholder="Şifre" type="text" {...field} />
                      </FormControl>
                      <Button type="button" variant="outline" onClick={generatePassword}>
                        Oluştur
                      </Button>
                    </div>
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
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={() => form.reset()}>
                Temizle
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kullanıcı Oluştur
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 