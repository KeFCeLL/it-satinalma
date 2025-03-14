"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { FileUpload } from "@/components/ui/file-upload";
import { ProductSelector } from "@/components/forms/product-selector";
import { Product } from "@/lib/services/product-service";
import { TalepDurumu } from "@/types/talep";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createRequest } from "@/lib/services/request-service";
import axios from "axios";
import { useAuth } from "@/lib/context/auth-context";

const formSchema = z.object({
  baslik: z.string().min(5, {
    message: "Başlık en az 5 karakter olmalıdır.",
  }),
  aciklama: z.string().min(10, {
    message: "Açıklama en az 10 karakter olmalıdır.",
  }),
  miktar: z.coerce.number().min(1, {
    message: "Miktar en az 1 olmalıdır.",
  }),
  tahminiTeslimTarihi: z.date({
    required_error: "Tahmini teslim tarihi seçmelisiniz.",
  }),
  oncelikDurumu: z.enum(["DUSUK", "ORTA", "YUKSEK"], {
    required_error: "Öncelik durumunu seçmelisiniz.",
  }),
  departmanId: z.string({
    required_error: "Departman seçmelisiniz.",
  }),
  dosyalar: z.array(z.instanceof(File)).optional(),
  urun: z.object({
    id: z.string(),
    ad: z.string(),
    birimFiyat: z.number(),
  }).optional(),
});

export function TalepForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [departments, setDepartments] = useState<{ id: string; ad: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      baslik: "",
      aciklama: "",
      miktar: 1,
      oncelikDurumu: "ORTA",
      departmanId: user?.departman?.id || "",
      dosyalar: [],
    },
  });

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        console.log("Departmanlar yükleniyor...");
        // API'den departmanları çek
        const response = await fetch('/api/departmanlar');
        if (!response.ok) {
          throw new Error('Departmanlar yüklenirken bir hata oluştu');
        }
        
        const responseData = await response.json();
        console.log("Departman API yanıtı:", responseData);
        
        // API yanıtı responseData.departmanlar içinde geliyor, data içinde değil
        if (responseData.success && responseData.departmanlar) {
          console.log("Yüklenen departmanlar:", responseData.departmanlar);
          setDepartments(responseData.departmanlar);
          
          // Eğer kullanıcının departmanı varsa ve listede mevcutsa, otomatik seçelim
          if (user?.departman?.id) {
            const userDeptExists = responseData.departmanlar.some(
              (dept: { id: string }) => dept.id === user.departman?.id
            );
            
            if (userDeptExists) {
              console.log("Kullanıcının departmanı listede bulundu:", user.departman);
              form.setValue("departmanId", user.departman.id);
            } else {
              console.log("Kullanıcının departmanı listede bulunamadı:", user.departman);
              // Listede olmayan bir departman ID'si var, formdan kaldıralım
              form.setValue("departmanId", "");
            }
          } else {
            console.log("Kullanıcı departmanı tanımlı değil");
            // Eğer departman listesi doluysa ve kullanıcının departmanı yoksa, ilk departmanı seçelim
            if (responseData.departmanlar.length > 0) {
              form.setValue("departmanId", responseData.departmanlar[0].id);
            }
          }
        } else {
          console.error("Departmanlar yüklenemedi veya boş döndü:", responseData);
          toast.error("Departmanlar yüklenemedi");
        }
      } catch (error) {
        console.error("Departmanlar yüklenirken hata:", error);
        toast.error("Departmanlar yüklenirken bir hata oluştu");
      }
    };

    fetchDepartments();
  }, [user, form]);

  useEffect(() => {
    if (selectedProduct) {
      form.setValue("urun", {
        id: selectedProduct.id,
        ad: selectedProduct.ad,
        birimFiyat: selectedProduct.birimFiyat,
      });
    } else {
      form.setValue("urun", undefined);
    }
  }, [selectedProduct, form]);

  useEffect(() => {
    form.setValue("dosyalar", uploadedFiles);
  }, [uploadedFiles, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      
      // Ürün seçilmediğini kontrol et
      if (!values.urun || !values.urun.id) {
        toast.error("Lütfen bir ürün seçin.");
        setLoading(false);
        return;
      }

      // Departman seçimini kontrol et
      if (!values.departmanId) {
        toast.error("Lütfen bir departman seçin.");
        setLoading(false);
        return;
      }
      
      // Departman ID'sinin format kontrolü
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(values.departmanId)) {
        console.error("Geçersiz departman ID formatı:", values.departmanId);
        toast.error("Geçersiz departman formatı. Lütfen geçerli bir departman seçin.");
        setLoading(false);
        return;
      }
      
      console.log("Departman ID kontrolü geçildi:", values.departmanId);
      
      // Form değerlerini API formatına dönüştür
      const talepData = {
        baslik: values.baslik,
        aciklama: values.aciklama,
        gerekce: values.aciklama, // Açıklama alanını gerekçe olarak da kullanıyoruz
        departmanId: values.departmanId,
        oncelik: values.oncelikDurumu, // Form'da oncelikDurumu, API'de oncelik
        tahminiTutar: values.urun ? values.urun.birimFiyat * values.miktar : 0,
        urunTalepler: [
          {
            urunId: values.urun.id,
            miktar: values.miktar || 1,
            tutar: values.urun.birimFiyat * (values.miktar || 1)
          }
        ]
      };
      
      console.log("Talep oluşturuluyor:", talepData);
      
      // Talebi oluştur - API doğrudan çağrılıyor (request-service yerine)
      let responseData: any;
      try {
        console.log("API isteği gönderiliyor:", {
          url: '/api/talepler',
          method: 'POST',
          body: talepData
        });
        
        const response = await fetch('/api/talepler', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(talepData),
          credentials: 'include', // Cookie'leri dahil et
        });
        
        if (!response) {
          throw new Error("API yanıtı alınamadı");
        }
        
        console.log("API yanıtı alındı:", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });
        
        responseData = await response.json();
        console.log("API yanıt içeriği:", responseData);
        
        if (!response.ok) {
          // Hata mesajını daha anlaşılır şekilde işle
          let errorMessage = 'Talep oluştururken bir hata oluştu';
          
          if (responseData.message) {
            errorMessage = responseData.message;
            
            // Departman hatası için özel durumu ele al
            if (responseData.message === 'Geçersiz departman') {
              errorMessage = `Departman bulunamadı (ID: ${values.departmanId}). Lütfen geçerli bir departman seçin.`;
              console.error("Veritabanında bulunamayan departman ID'si:", values.departmanId);
            }
          }
          
          toast.error(errorMessage);
          setLoading(false);
          throw new Error(errorMessage);
        }
      } catch (apiError) {
        console.error("API isteği hatası:", apiError);
        toast.error("Talep oluşturulurken bir hata oluştu: " + (apiError instanceof Error ? apiError.message : "Bilinmeyen hata"));
        setLoading(false);
        throw apiError;
      }
      
      // responseData içindeki data objesini kontrol et
      if (!responseData.data) {
        console.warn("API yanıtında data alanı yok:", responseData);
        toast.error("API yanıtı beklenmeyen formatta. Lütfen tekrar deneyin.");
        setLoading(false);
        return;
      }
      
      const talep = responseData.data;
      console.log("Talep oluşturuldu:", talep);
      
      // Dosya yüklemesi varsa
      if (uploadedFiles.length > 0) {
        try {
          console.log(`${uploadedFiles.length} dosya yüklenecek...`);
          await uploadFiles(talep.id, uploadedFiles);
        } catch (fileError) {
          console.error("Dosya yükleme hatası:", fileError);
          toast.error("Talep oluşturuldu ancak dosyalar yüklenirken bir hata oluştu.");
        }
      }
      
      // Başarılı işlem
      toast.success("Talep başarıyla oluşturuldu!");
      form.reset();
      setSelectedProduct(null);
      setUploadedFiles([]);
      
      // Talepler sayfasına yönlendir
      setTimeout(() => {
        router.push("/talepler");
      }, 1500);
    } catch (error: any) {
      console.error("Talep oluşturulurken hata:", error);
      toast.error(
        error.message || 
        "Talep oluşturulurken bir hata oluştu. Lütfen tekrar deneyin."
      );
    } finally {
      setLoading(false);
    }
  };

  // Dosya yükleme fonksiyonu
  const uploadFiles = async (talepId: string, files: File[]) => {
    const formData = new FormData();
    
    // Her dosyayı formData'ya ekle
    files.forEach((file) => {
      formData.append("dosya", file);
    });
    
    try {
      const response = await axios.post(
        `/api/talepler/${talepId}/dosyalar`, 
        formData, 
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            console.log(`Yükleme ilerlemesi: ${percentCompleted}%`);
          },
          timeout: 60000, // 60 saniye timeout
        }
      );
      
      console.log("Dosyalar yüklendi:", response.data);
      return response.data;
    } catch (error) {
      console.error("Dosya yükleme hatası:", error);
      throw error;
    }
  };

  const handleFileSelect = (files: File[]) => {
    console.log("Seçilen dosyalar:", files.map(f => `${f.name} (${f.size} bytes)`));
    setUploadedFiles(files);
  };

  const handleProductSelect = (product: Product | null) => {
    setSelectedProduct(product);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="baslik"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Başlık</FormLabel>
              <FormControl>
                <Input placeholder="Talep başlığı" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="aciklama"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Açıklama</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Talep açıklaması"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormItem className="flex flex-col">
            <FormLabel>Ürün Seçimi</FormLabel>
            <ProductSelector
              onProductSelect={handleProductSelect}
              selectedProductId={selectedProduct?.id}
            />
            {selectedProduct && (
              <FormDescription>
                Seçili ürün: {selectedProduct.ad} - 
                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(selectedProduct.birimFiyat)}
              </FormDescription>
            )}
          </FormItem>

          <FormField
            control={form.control}
            name="miktar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Miktar</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="departmanId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Departman</FormLabel>
                <Select
                  onValueChange={(value) => {
                    console.log("Departman seçildi:", value);
                    field.onChange(value);
                  }}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Departman seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments && departments.length > 0 ? (
                      departments.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.ad}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="yukleniyor" disabled>Departmanlar yükleniyor...</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Talebin hangi departman için olduğunu seçin
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="oncelikDurumu"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Öncelik</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Öncelik seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="DUSUK">Düşük</SelectItem>
                    <SelectItem value="ORTA">Orta</SelectItem>
                    <SelectItem value="YUKSEK">Yüksek</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="tahminiTeslimTarihi"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Tahmini Teslim Tarihi</FormLabel>
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                disabled={(date) =>
                  date < new Date() || date > new Date(new Date().setMonth(new Date().getMonth() + 6))
                }
                initialFocus
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dosyalar"
          render={() => (
            <FormItem>
              <FormLabel>Destekleyici Dosyalar</FormLabel>
              <FormControl>
                <FileUpload 
                  onFilesSelected={handleFileSelect}
                  maxFiles={5}
                  maxSize={5 * 1024 * 1024} // 5MB
                  acceptedTypes={{
                    'application/pdf': ['.pdf'],
                    'image/jpeg': ['.jpg', '.jpeg'],
                    'image/png': ['.png'],
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                  }}
                />
              </FormControl>
              <FormDescription>
                En fazla 5 dosya yükleyebilirsiniz (PDF, JPG, PNG, XLSX, DOCX). Dosya başına maksimum boyut: 5MB.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            İptal
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Gönderiliyor..." : "Talep Oluştur"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 