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
  }).min(new Date(), {
    message: "Tahmini teslim tarihi geçmiş bir tarih olamaz.",
  }).max(new Date(new Date().setMonth(new Date().getMonth() + 6)), {
    message: "Tahmini teslim tarihi en fazla 6 ay sonrası olabilir.",
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
      form.setValue("urun", {
        id: "",
        ad: "",
        birimFiyat: 0
      });
    }
  }, [selectedProduct, form]);

  useEffect(() => {
    form.setValue("dosyalar", uploadedFiles);
  }, [uploadedFiles, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      
      // Form değerlerini API formatına dönüştür
      const talepData = {
        baslik: values.baslik,
        aciklama: values.aciklama,
        gerekce: values.aciklama,
        departmanId: values.departmanId,
        oncelik: values.oncelikDurumu,
        tahminiTeslimTarihi: values.tahminiTeslimTarihi ? new Date(values.tahminiTeslimTarihi).toISOString() : null,
        tahminiTutar: values.urun?.birimFiyat ? values.urun.birimFiyat * values.miktar : 0,
        urunTalepler: values.urun ? [
          {
            urunId: values.urun.id,
            miktar: values.miktar || 1,
            tutar: values.urun.birimFiyat * (values.miktar || 1)
          }
        ] : []
      };
      
      console.log("Talep oluşturuluyor:", talepData);
      
      // Talebi oluştur
      const response = await fetch('/api/talepler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(talepData),
        credentials: 'include', // Cookie'leri gönder
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('API yanıtı:', responseData);
        if (response.status === 401) {
          toast.error("Oturumunuz sonlanmış. Lütfen tekrar giriş yapın.");
          router.push('/giris');
          return;
        }
        throw new Error(responseData.message || 'Sunucu hatası');
      }

      if (!responseData.data) {
        toast.error("Sunucu yanıtı beklenmeyen formatta. Lütfen tekrar deneyin.");
        return;
      }
      
      const talep = responseData.data;
      
      // Dosya yüklemesi varsa
      if (uploadedFiles.length > 0) {
        try {
          const uploadToast = toast.loading("Dosyalar yükleniyor...");
          
          await uploadFiles(talep.id, uploadedFiles);
          
          toast.dismiss(uploadToast);
          toast.success("Dosyalar başarıyla yüklendi");
        } catch (fileError) {
          console.error("Dosya yükleme hatası:", fileError);
          toast.error("Talep oluşturuldu ancak dosyalar yüklenirken bir hata oluştu.");
        }
      }
      
      toast.success("Talep başarıyla oluşturuldu!");
      form.reset();
      setSelectedProduct(null);
      setUploadedFiles([]);
      
      // Talepler sayfasına yönlendir
      router.push("/talepler");
    } catch (error: any) {
      console.error("Talep oluşturulurken hata:", error);
      toast.error(error.message || "Talep oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  // Dosya yükleme fonksiyonu
  const uploadFiles = async (talepId: string, files: File[]) => {
    const formData = new FormData();
    
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
            toast.loading(`Dosyalar yükleniyor... ${percentCompleted}%`, {
              id: "upload-progress"
            });
          },
          timeout: 30000, // 30 saniye timeout
        }
      );
      
      toast.dismiss("upload-progress");
      return response.data;
    } catch (error) {
      toast.dismiss("upload-progress");
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
                onSelect={(date) => {
                  if (date) {
                    field.onChange(date);
                  }
                }}
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
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            disabled={loading}
          >
            İptal
          </Button>
          <Button 
            type="submit" 
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Gönderiliyor...
              </div>
            ) : "Talep Oluştur"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 