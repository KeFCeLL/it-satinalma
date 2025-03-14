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

  // Departmanları yükle
  useEffect(() => {
    const fetchDepartmanlar = async () => {
      try {
        // Gerçek API çağrısı yap
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
        } else {
          // API yanıt formatı beklenenden farklı, mock verilerle devam et
          console.warn("API yanıt formatı beklenen gibi değil, varsayılan departmanlar kullanılıyor", data);
          const mockDepartmanlar: Department[] = [
            { id: "1", ad: "Yönetim", aciklama: "Yönetim departmanı", createdAt: "", updatedAt: "" },
            { id: "2", ad: "Satınalma", aciklama: "Satınalma departmanı", createdAt: "", updatedAt: "" },
            { id: "3", ad: "IT", aciklama: "IT departmanı", createdAt: "", updatedAt: "" },
            { id: "4", ad: "Finans", aciklama: "Finans departmanı", createdAt: "", updatedAt: "" },
            { id: "5", ad: "İnsan Kaynakları", aciklama: "İnsan Kaynakları departmanı", createdAt: "", updatedAt: "" },
          ];
          
          setDepartmanlar(mockDepartmanlar);
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