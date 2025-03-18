"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, RefreshCw, Search } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Department } from "@/lib/services/department-service";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchWithoutCache } from "@/lib/api-config";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

// Form şemaları
const departmentFormSchema = z.object({
  ad: z.string().min(1, { message: 'Departman adı zorunludur' }),
  aciklama: z.string().optional(),
});

// Varsayılan departmanlar - API boş dönerse kullanılır
const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'default-1', ad: 'Yazılım Geliştirme', aciklama: 'Uygulama ve hizmetlerin geliştirilmesi', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'default-2', ad: 'İnsan Kaynakları', aciklama: 'Personel işlemleri ve insan kaynakları yönetimi', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'default-3', ad: 'Pazarlama', aciklama: 'Ürün ve hizmetlerin pazarlanması', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'default-4', ad: 'Finans', aciklama: 'Mali işlemler ve finansal yönetim', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'default-5', ad: 'Satınalma', aciklama: 'Tedarik zinciri ve satın alma operasyonları', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

// LocalStorage anahtar sabiti
const LS_DEPARTMENTS_KEY = 'it_satinalma_departments';

export function DepartmanYonetimi() {
  const [departmanlar, setDepartmanlar] = useState<Department[]>([]);
  const [filteredDepartmanlar, setFilteredDepartmanlar] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDepartmentId, setDeletingDepartmentId] = useState<string | null>(null);
  const [yeniDepartman, setYeniDepartman] = useState({ ad: '', aciklama: '' });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const router = useRouter();

  // Form tanımlaması
  const form = useForm<z.infer<typeof departmentFormSchema>>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      ad: "",
      aciklama: "",
    },
  });

  // Departmanları yükle
  const fetchDepartmanlar = useCallback(async (force = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Departmanlar getiriliyor...');
      
      // API'den departmanları getir, önbelleği atlayarak
      const response = await fetchWithoutCache(`${apiPaths.departmanlar}?hepsi=true`);
      console.log('📊 API yanıtı:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`API hatası: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📋 API veri:', data);
      
      if (data.success && data.departmanlar && Array.isArray(data.departmanlar)) {
        // API'den gelen departmanları ayarla
        const fetchedDepartments = data.departmanlar;
        
        // Departmanlar boş gelirse, varsayılan departmanları göster
        if (fetchedDepartments.length === 0) {
          console.log('⚠️ API boş departman listesi döndü, varsayılan değerler kullanılıyor');
          setDepartmanlar(DEFAULT_DEPARTMENTS);
          setFilteredDepartmanlar(DEFAULT_DEPARTMENTS);
          
          // LocalStorage'a varsayılan departmanları kaydet
          localStorage.setItem(LS_DEPARTMENTS_KEY, JSON.stringify(DEFAULT_DEPARTMENTS));
          
          // Bildirim göster
          toast.warning('Veritabanından departman bilgisi alınamadı. Varsayılan departmanlar gösteriliyor.');
        } else {
          console.log('✅ Departmanlar başarıyla yüklendi:', fetchedDepartments.length);
          setDepartmanlar(fetchedDepartments);
          setFilteredDepartmanlar(fetchedDepartments);
          
          // LocalStorage'a departmanları kaydet
          localStorage.setItem(LS_DEPARTMENTS_KEY, JSON.stringify(fetchedDepartments));
        }
      } else if (data.data && Array.isArray(data.data)) {
        // Eski API formatı desteği
        const fetchedDepartments = data.data;
        setDepartmanlar(fetchedDepartments);
        setFilteredDepartmanlar(fetchedDepartments);
        
        // LocalStorage'a departmanları kaydet
        localStorage.setItem(LS_DEPARTMENTS_KEY, JSON.stringify(fetchedDepartments));
      } else {
        // Başarılı yanıt alınamadıysa, LocalStorage'dan yükle
        console.log('⚠️ API geçerli veri döndürmedi, lokalden yükleniyor');
        loadDepartmentsFromLocalStorage();
        
        toast.warning('Sunucudan departman verisi alınamadı. Kaydedilmiş veriler gösteriliyor.');
      }
    } catch (err: any) {
      console.error('❌ Departmanlar yüklenirken hata:', err);
      
      // Hata durumunda localStorage'a bak
      loadDepartmentsFromLocalStorage();
      
      setError(`Departmanlar yüklenirken bir hata oluştu: ${err.message}. Yerel veriler gösteriliyor.`);
      toast.error(`Hata: ${err.message}. Kaydedilmiş veriler gösteriliyor.`);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // LocalStorage'dan departmanları yükle
  const loadDepartmentsFromLocalStorage = () => {
    try {
      const savedDepartments = localStorage.getItem(LS_DEPARTMENTS_KEY);
      if (savedDepartments) {
        const parsed = JSON.parse(savedDepartments);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log('📦 LocalStorage\'dan departmanlar yüklendi:', parsed.length);
          setDepartmanlar(parsed);
          setFilteredDepartmanlar(parsed);
          return true;
        }
      }
      
      // LocalStorage boş ise varsayılan departmanları kullan
      console.log('📦 LocalStorage boş, varsayılan departmanlar kullanılıyor');
      setDepartmanlar(DEFAULT_DEPARTMENTS);
      setFilteredDepartmanlar(DEFAULT_DEPARTMENTS);
      return false;
    } catch (err) {
      console.error('❌ LocalStorage\'dan okuma hatası:', err);
      setDepartmanlar(DEFAULT_DEPARTMENTS);
      setFilteredDepartmanlar(DEFAULT_DEPARTMENTS);
      return false;
    }
  };

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

  // Sayfa yüklendiğinde departmanları getir
  useEffect(() => {
    // Önce localStorage'dan hızlıca yükle (UI gecikmesini önlemek için)
    const hasLocalData = loadDepartmentsFromLocalStorage();
    
    // Sonra API'den taze veriyi getir
    fetchDepartmanlar();
    
    // Component unmount olduğunda iptal işlemi
    return () => {
      // İptal işlemleri
    };
  }, [fetchDepartmanlar]);

  // Departman ekleme işlemi
  const handleAddDepartman = async () => {
    if (!yeniDepartman.ad.trim()) {
      setNotification({
        open: true,
        message: 'Departman adı boş olamaz',
        severity: 'error'
      });
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(apiPaths.departmanlar, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store'
        },
        body: JSON.stringify(yeniDepartman)
      });
      
      if (!response.ok) {
        throw new Error(`API hatası: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Yeni departmanı listeye ekle
        const updatedDepartments = [...departmanlar, result.departman];
        setDepartmanlar(updatedDepartments);
        
        // LocalStorage'ı güncelle
        localStorage.setItem(LS_DEPARTMENTS_KEY, JSON.stringify(updatedDepartments));
        
        setNotification({
          open: true,
          message: 'Departman başarıyla eklendi',
          severity: 'success'
        });
        
        // Formu temizle ve kapat
        setYeniDepartman({ ad: '', aciklama: '' });
        setAddDialogOpen(false);
      } else {
        throw new Error(result.message || 'Departman eklenemedi');
      }
    } catch (err: any) {
      console.error('❌ Departman eklenirken hata:', err);
      
      // Hata durumunda frontend'de ekleyerek UI'ı güncelleyelim
      const mockDepartman = {
        id: `temp-${Date.now()}`,
        ad: yeniDepartman.ad,
        aciklama: yeniDepartman.aciklama,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _isLocal: true
      };
      
      const updatedDepartments = [...departmanlar, mockDepartman];
      setDepartmanlar(updatedDepartments);
      
      // LocalStorage'ı güncelle
      localStorage.setItem(LS_DEPARTMENTS_KEY, JSON.stringify(updatedDepartments));
      
      setNotification({
        open: true,
        message: `Departman sunucuya kaydedilemedi, ancak yerel olarak eklendi. Hata: ${err.message}`,
        severity: 'warning'
      });
      
      // Formu temizle ve kapat
      setYeniDepartman({ ad: '', aciklama: '' });
      setAddDialogOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // Departman silme
  const handleDeleteDepartment = async () => {
    if (!deletingDepartmentId) return;

    try {
      console.log("Departman silme isteği gönderiliyor, ID:", deletingDepartmentId);
      
      const response = await fetch(`${apiPaths.departmanlar}/${deletingDepartmentId}`, {
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

  // Bildirim kapatma
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Yenile butonu
  const handleRefresh = () => {
    fetchDepartmanlar(true);
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
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="outlined"
                onClick={handleRefresh}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                Yenile
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={() => setAddDialogOpen(true)}
                disabled={loading}
              >
                Yeni Departman
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <CircularProgress />
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

      {/* Yeni Departman Ekleme Diyaloğu */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle>Yeni Departman Ekle</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Departman Adı"
            type="text"
            fullWidth
            value={yeniDepartman.ad}
            onChange={(e) => setYeniDepartman({ ...yeniDepartman, ad: e.target.value })}
            required
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            label="Açıklama"
            type="text"
            fullWidth
            value={yeniDepartman.aciklama}
            onChange={(e) => setYeniDepartman({ ...yeniDepartman, aciklama: e.target.value })}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)} disabled={loading}>
            İptal
          </Button>
          <Button 
            onClick={handleAddDepartman} 
            color="primary" 
            disabled={loading || !yeniDepartman.ad.trim()}
            variant="contained"
          >
            {loading ? <CircularProgress size={24} /> : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bildirim */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity as any} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </div>
  );
} 