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

  // Departmanları getir
  useEffect(() => {
    const fetchDepartmanlar = async () => {
      try {
        // önce yerel depodan departmanları kontrol et
        const storedDepartments = localStorage.getItem('departmanlar');
        if (storedDepartments) {
          try {
            const parsedDepartments = JSON.parse(storedDepartments);
            console.log("Yerel depodan departmanlar yüklendi:", parsedDepartments);
            setDepartmanlar(parsedDepartments);
          } catch (parseError) {
            console.error("Departmanlar yerel depodan ayrıştırılamadı:", parseError);
          }
        }
        
        // Departmanları API'den getir
        console.log("Departmanlar API'si çağrılıyor...");
        const response = await fetch('/api/departmanlar?hepsi=true', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API hatası: ${response.status} ${response.statusText}. ${errorText.substring(0, 100)}`);
        }
        
        // Yanıtı console'a yazdır (hata ayıklama için)
        console.log("Departmanlar API yanıtı status:", response.status, response.statusText);
        
        const data = await response.json();
        console.log("Departmanlar API yanıtı:", data);
        
        // Yanıttaki departmanlar dizisini kontrol et
        if (data.departmanlar && Array.isArray(data.departmanlar)) {
          if (data.departmanlar.length > 0) {
            console.log(`${data.departmanlar.length} departman başarıyla yüklendi`);
            setDepartmanlar(data.departmanlar);
            
            // Yeni departmanları yerel depoya da kaydet
            localStorage.setItem('departmanlar', JSON.stringify(data.departmanlar));
          } else {
            console.log("Departmanlar dizisi boş, varsayılan departmanlar kullanılacak");
            
            // Departman yoksa 2 örnek departman ekleme isteği gönder
            await createDefaultDepartments();
          }
        } else if (data.data && Array.isArray(data.data)) {
          setDepartmanlar(data.data);
          localStorage.setItem('departmanlar', JSON.stringify(data.data));
        } else {
          throw new Error("API'den geçerli departman verisi alınamadı");
        }
      } catch (error: any) {
        console.error("Departmanlar yüklenirken hata:", error);
        toast.error(`Departmanlar yüklenirken hata oluştu: ${error.message}`);
        
        // Hata durumunda varsayılan departmanları göster
        const mockDepartmanlar: Department[] = [
          { id: "1", ad: "Yönetim", aciklama: "Yönetim departmanı", createdAt: "", updatedAt: "" },
          { id: "2", ad: "Satınalma", aciklama: "Satınalma departmanı", createdAt: "", updatedAt: "" },
          { id: "3", ad: "IT", aciklama: "IT departmanı", createdAt: "", updatedAt: "" },
          { id: "4", ad: "Finans", aciklama: "Finans departmanı", createdAt: "", updatedAt: "" },
          { id: "5", ad: "İnsan Kaynakları", aciklama: "İnsan Kaynakları departmanı", createdAt: "", updatedAt: "" },
        ];
        
        setDepartmanlar(mockDepartmanlar);
      }
    };

    // Varsayılan departmanları oluşturmak için yardımcı fonksiyon
    const createDefaultDepartments = async () => {
      try {
        const defaultDepartments = [
          { ad: "Yazılım Geliştirme", aciklama: "Yazılım geliştirme ve bakım" },
          { ad: "İnsan Kaynakları", aciklama: "Personel yönetimi ve işe alım" }
        ];
        
        for (const dept of defaultDepartments) {
          console.log(`Varsayılan departman oluşturuluyor: ${dept.ad}`);
          
          const response = await fetch('/api/departmanlar', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            },
            body: JSON.stringify(dept),
            credentials: 'include'
          });
          
          if (response.ok) {
            console.log(`${dept.ad} departmanı başarıyla oluşturuldu`);
          } else {
            console.error(`${dept.ad} departmanı oluşturulamadı: ${response.status} ${response.statusText}`);
          }
        }
        
        // Departmanları tekrar yükle
        const refreshResponse = await fetch('/api/departmanlar?hepsi=true', {
          cache: 'no-store',
          credentials: 'include'
        });
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          if (refreshData.departmanlar && Array.isArray(refreshData.departmanlar)) {
            setDepartmanlar(refreshData.departmanlar);
            localStorage.setItem('departmanlar', JSON.stringify(refreshData.departmanlar));
          }
        }
      } catch (error: any) {
        console.error("Varsayılan departmanlar oluşturulamadı:", error);
      }
    };

    fetchDepartmanlar();
  }, []);

  // Form gönderildiğinde
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      // Departman ID'si boş string ise null olarak ayarla
      const formData = {
        ...values,
        departmanId: values.departmanId && values.departmanId.trim() !== "" ? values.departmanId : null
      };
      
      console.log("Kullanıcı oluşturma isteği gönderiliyor:", formData);
      
      // API çağrısı ile kullanıcı oluştur
      const response = await fetch('/api/kullanicilar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include' // Cookie bilgilerini gönder
      });

      // Yanıtı console'a yazdır (hata ayıklama için)
      console.log("API yanıtı status:", response.status, response.statusText);
      
      let responseData;
      try {
        // Önce JSON olarak parse etmeyi dene
        responseData = await response.json();
        console.log("API yanıtı (JSON):", responseData);
      } catch (parseError) {
        // JSON parse başarısız olursa text olarak al
        const text = await response.text();
        console.log("API yanıtı (text):", text);
        responseData = { error: `Sunucudan geçersiz yanıt: ${text.substring(0, 100)}...` };
      }
      
      if (!response.ok) {
        const errorMessage = responseData.error || responseData.message || `Sunucu hatası: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      // Başarılı olduğunda bu mesajı göster
      toast.success(`${values.ad} ${values.soyad} kullanıcısı başarıyla oluşturuldu!`);
      
      // Formu sıfırla
      form.reset();
      
      // Başarı callback'ini çağır (Listeye dön)
      onSuccess();
    } catch (error: any) {
      console.error("Kullanıcı oluşturma hatası:", error);
      toast.error(`Kullanıcı oluşturulurken hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
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