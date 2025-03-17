"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil, Plus, Trash2, Search, RefreshCw } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Department } from "@/lib/services/department-service";
import { ScrollArea } from "@/components/ui/scroll-area";

// Form şemaları
const departmentFormSchema = z.object({
  ad: z.string().min(2, "Departman adı en az 2 karakter olmalıdır"),
  aciklama: z.string().optional(),
});

export function DepartmanYonetimi() {
  const [departmanlar, setDepartmanlar] = useState<Department[]>([]);
  const [filteredDepartmanlar, setFilteredDepartmanlar] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDepartmentId, setDeletingDepartmentId] = useState<string | null>(null);

  // Form tanımlaması
  const form = useForm<z.infer<typeof departmentFormSchema>>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      ad: "",
      aciklama: "",
    },
  });

  // Departmanları yükle
  useEffect(() => {
    fetchDepartmanlar();
  }, []);

  // Arama filtresini uygula
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredDepartmanlar(departmanlar);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      const filtered = departmanlar.filter(
        (dep) =>
          dep.ad.toLowerCase().includes(lowercasedSearch) ||
          (dep.aciklama && dep.aciklama.toLowerCase().includes(lowercasedSearch))
      );
      setFilteredDepartmanlar(filtered);
    }
  }, [searchTerm, departmanlar]);

  // Departmanları getir
  const fetchDepartmanlar = async () => {
    setIsLoading(true);
    try {
      // Gerçek API çağrısı
      const response = await fetch("/api/departmanlar?hepsi=true", {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Departmanlar yüklenirken bir hata oluştu");
      }
      
      const data = await response.json();
      console.log("Departmanlar verileri:", data);
      
      if (data.departmanlar) {
        setDepartmanlar(data.departmanlar);
        setFilteredDepartmanlar(data.departmanlar);
      } else if (data.data) {
        setDepartmanlar(data.data);
        setFilteredDepartmanlar(data.data);
      } else {
        toast.error("API'den beklenen formatta veri alınamadı");
        setDepartmanlar([]);
        setFilteredDepartmanlar([]);
      }
    } catch (error: any) {
      console.error("Departmanlar yüklenirken hata:", error);
      toast.error(`Departmanlar yüklenirken hata oluştu: ${error.message}`);
      setDepartmanlar([]);
      setFilteredDepartmanlar([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Departman ekleme/güncelleme
  const handleSubmit = async (values: z.infer<typeof departmentFormSchema>) => {
    try {
      console.log("Departman form değerleri:", values);
      
      let response;
      let successMessage;
      let options = {
        method: editingDepartment ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
        credentials: 'include' as RequestCredentials
      };

      console.log("API isteği gönderiliyor:", editingDepartment ? "PUT (düzenleme)" : "POST (ekleme)");

      if (editingDepartment) {
        // Güncelleme
        response = await fetch(`/api/departmanlar/${editingDepartment.id}`, options);
        successMessage = `${values.ad} departmanı başarıyla güncellendi`;
      } else {
        // Yeni ekleme
        response = await fetch("/api/departmanlar", options);
        successMessage = `${values.ad} departmanı başarıyla oluşturuldu`;
      }

      console.log("API yanıtı status:", response.status, response.statusText);
      
      // Yanıt içeriğini al
      let responseText;
      try {
        responseText = await response.text();
        console.log("API yanıt içeriği:", responseText);
      } catch (e) {
        console.error("Yanıt metni alınamadı:", e);
        responseText = "";
      }
      
      // JSON olarak parse etmeyi dene
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
        console.log("API yanıtı (JSON):", responseData);
      } catch (parseError) {
        console.error("JSON parse hatası:", parseError);
        throw new Error(`JSON parse hatası: ${responseText.substring(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || "İşlem sırasında bir hata oluştu");
      }

      toast.success(successMessage);
      setIsDialogOpen(false);
      form.reset();
      
      // Yanıt başarılıysa, departman listesini manuel olarak güncelleyelim
      if (responseData.departman || responseData.data) {
        const yeniDepartman = responseData.departman || responseData.data;
        
        if (editingDepartment) {
          // Mevcut departmanı güncelle
          const updatedDepartmanlar = departmanlar.map(dep => 
            dep.id === editingDepartment.id ? yeniDepartman : dep
          );
          setDepartmanlar(updatedDepartmanlar);
        } else {
          // Yeni departmanı listeye ekle
          setDepartmanlar(prevDepartmanlar => [yeniDepartman, ...prevDepartmanlar]);
        }
      } else {
        // API'den alınan yanıtta departman verisi yoksa, tam listeyi yeniden çekelim
        fetchDepartmanlar();
      }
    } catch (error: any) {
      console.error("Departman işlemi hatası:", error);
      toast.error(`İşlem sırasında hata oluştu: ${error.message}`);
    }
  };

  // Departman silme
  const handleDeleteDepartment = async () => {
    if (!deletingDepartmentId) return;

    try {
      console.log("Departman silme isteği gönderiliyor, ID:", deletingDepartmentId);
      
      const response = await fetch(`/api/departmanlar/${deletingDepartmentId}`, {
        method: "DELETE",
        credentials: 'include'
      });

      console.log("API yanıtı status:", response.status, response.statusText);
      
      // Yanıt içeriğini al
      let responseData;
      try {
        const responseText = await response.text();
        console.log("API yanıt içeriği:", responseText);
        
        // JSON olarak parse etmeyi dene
        try {
          responseData = responseText ? JSON.parse(responseText) : {};
          console.log("API yanıtı (JSON):", responseData);
        } catch (parseError) {
          console.error("JSON parse hatası:", parseError);
          throw new Error(`JSON parse hatası: ${responseText.substring(0, 100)}`);
        }
      } catch (e) {
        console.error("Yanıt işleme hatası:", e);
        throw new Error("Sunucu yanıtı alınamadı");
      }

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || "Departman silinirken bir hata oluştu");
      }

      toast.success("Departman başarıyla silindi");
      setDeleteDialogOpen(false);
      setDeletingDepartmentId(null);
      fetchDepartmanlar(); // Listeyi yenile
    } catch (error: any) {
      console.error("Departman silme hatası:", error);
      toast.error(`Departman silinirken hata oluştu: ${error.message}`);
    }
  };

  // Düzenleme için departman ayarla
  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    form.reset({
      ad: department.ad,
      aciklama: department.aciklama || "",
    });
    setIsDialogOpen(true);
  };

  // Yeni departman ekleme
  const handleAddNewDepartment = () => {
    setEditingDepartment(null);
    form.reset({
      ad: "",
      aciklama: "",
    });
    setIsDialogOpen(true);
  };

  // Silme işlemi için departman seç
  const handleDeleteDialog = (departmentId: string) => {
    setDeletingDepartmentId(departmentId);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Departman Yönetimi</CardTitle>
          <CardDescription>
            Şirket departmanlarını görüntüleyin, ekleyin, düzenleyin ve silin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Departman ara..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={handleAddNewDepartment}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Departman
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Departman Adı</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Oluşturulma Tarihi</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDepartmanlar.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Departman bulunamadı
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDepartmanlar.map((departman) => (
                      <TableRow key={departman.id}>
                        <TableCell className="font-medium">{departman.id}</TableCell>
                        <TableCell>{departman.ad}</TableCell>
                        <TableCell>{departman.aciklama || "—"}</TableCell>
                        <TableCell>
                          {departman.createdAt
                            ? new Date(departman.createdAt).toLocaleDateString("tr-TR")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditDepartment(departman)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteDialog(departman.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Departman Ekle/Düzenle Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDepartment ? "Departmanı Düzenle" : "Yeni Departman Ekle"}
            </DialogTitle>
            <DialogDescription>
              {editingDepartment
                ? "Departman bilgilerini güncelleyin"
                : "Sisteme yeni bir departman ekleyin"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="ad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departman Adı</FormLabel>
                    <FormControl>
                      <Input placeholder="Departman adı" {...field} />
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
                      <Input placeholder="Departman açıklaması" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  İptal
                </Button>
                <Button type="submit">
                  {editingDepartment ? "Güncelle" : "Oluştur"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Silme Onay Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Departman Silme Onayı</AlertDialogTitle>
            <AlertDialogDescription>
              Bu departmanı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve
              departmana atanmış kullanıcılar etkilenebilir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDepartment}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 