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

// API yolları
const apiPaths = {
  departmanlar: "/api/departmanlar"
};

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
      
      // Önce localStorage'dan departmanları yükle (hızlı görüntüleme için)
      if (!force) {
        const hasLocalData = loadDepartmentsFromLocalStorage();
        if (hasLocalData) {
          setIsLoading(false);
        }
      }
      
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
      toast.error('Departman adı boş olamaz');
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
      
      console.log('📊 API yanıtı (yeni departman):', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || `Sunucu hatası: ${response.status}`);
      }
      
      // Başarılı yanıt
      const data = await response.json();
      console.log('✅ Yeni departman oluşturuldu:', data);
      
      // API yanıtından oluşturulan departmanı al veya yapay bir ID ile kendimiz oluşturalım
      const newDepartment = data.departman || {
        ...yeniDepartman,
        id: `temp-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Departmanlar listesini güncelle
      const updatedDepartmanlar = [...departmanlar, newDepartment];
      setDepartmanlar(updatedDepartmanlar);
      setFilteredDepartmanlar(updatedDepartmanlar);
      
      // LocalStorage'a kaydet
      localStorage.setItem(LS_DEPARTMENTS_KEY, JSON.stringify(updatedDepartmanlar));
      
      // Form temizle ve dialog kapat
      setYeniDepartman({ ad: '', aciklama: '' });
      setAddDialogOpen(false);
      
      // Başarı bildirimi
      toast.success(`${newDepartment.ad} departmanı başarıyla oluşturuldu`);
    } catch (error: any) {
      console.error('❌ Departman oluşturma hatası:', error);
      toast.error(`Departman oluşturulurken hata: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Departman silme işlemi
  const handleDeleteDepartman = async () => {
    if (!deletingDepartmentId) return;
    
    setLoading(true);
    try {
      // API çağrısı
      const response = await fetch(`${apiPaths.departmanlar}/${deletingDepartmentId}`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache, no-store'
        }
      });
      
      console.log('📊 API yanıtı (departman silme):', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || `Sunucu hatası: ${response.status}`);
      }
      
      // Yerel listeden de sil
      const updatedDepartmanlar = departmanlar.filter(dep => dep.id !== deletingDepartmentId);
      setDepartmanlar(updatedDepartmanlar);
      setFilteredDepartmanlar(updatedDepartmanlar);
      
      // LocalStorage'ı güncelle
      localStorage.setItem(LS_DEPARTMENTS_KEY, JSON.stringify(updatedDepartmanlar));
      
      // Dialog kapat
      setDeleteDialogOpen(false);
      setDeletingDepartmentId(null);
      
      // Başarı bildirimi
      toast.success('Departman başarıyla silindi');
    } catch (error: any) {
      console.error('❌ Departman silme hatası:', error);
      toast.error(`Departman silinirken hata: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Departman düzenleme başlatma
  const startEditDepartman = (department: Department) => {
    setEditingDepartment(department);
    
    // Form değerlerini ayarla
    form.setValue('ad', department.ad);
    form.setValue('aciklama', department.aciklama || '');
    
    // Dialog aç
    setIsDialogOpen(true);
  };

  // Departman güncelleme
  const handleUpdateDepartman = async (values: z.infer<typeof departmentFormSchema>) => {
    if (!editingDepartment) return;
    
    setLoading(true);
    try {
      // API çağrısı
      const response = await fetch(`${apiPaths.departmanlar}/${editingDepartment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store'
        },
        body: JSON.stringify(values)
      });
      
      console.log('📊 API yanıtı (departman güncelleme):', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || `Sunucu hatası: ${response.status}`);
      }
      
      // Güncellenen departmanı yerel veride güncelle
      const updatedDepartmanlar = departmanlar.map(dep => {
        if (dep.id === editingDepartment.id) {
          return {
            ...dep,
            ...values,
            updatedAt: new Date().toISOString()
          };
        }
        return dep;
      });
      
      setDepartmanlar(updatedDepartmanlar);
      setFilteredDepartmanlar(updatedDepartmanlar);
      
      // LocalStorage'ı güncelle
      localStorage.setItem(LS_DEPARTMENTS_KEY, JSON.stringify(updatedDepartmanlar));
      
      // Dialog kapat ve form temizle
      setIsDialogOpen(false);
      setEditingDepartment(null);
      form.reset();
      
      // Başarı bildirimi
      toast.success(`${values.ad} departmanı güncellendi`);
    } catch (error: any) {
      console.error('❌ Departman güncelleme hatası:', error);
      toast.error(`Departman güncellenirken hata: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold">Departman Yönetimi</CardTitle>
            <CardDescription>
              Departmanları ekleyin, düzenleyin veya silin
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setAddDialogOpen(true)}
              className="flex gap-1 items-center"
            >
              <Plus className="h-4 w-4" />
              Departman Ekle
            </Button>
            <Button 
              variant="outline" 
              onClick={() => fetchDepartmanlar(true)}
              className="flex gap-1 items-center"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Yenile
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Hata</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-between mb-6">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Departman ara..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium">Departman Adı</TableHead>
                <TableHead className="font-medium">Açıklama</TableHead>
                <TableHead className="text-right font-medium w-[100px]">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                      <span>Departmanlar yükleniyor...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredDepartmanlar.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10">
                    {searchTerm ? (
                      <div>
                        <p className="text-muted-foreground">Arama sonucu bulunamadı</p>
                        <p className="text-sm text-muted-foreground mt-1">Aramanızı temizleyin veya yeni departman ekleyin</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-muted-foreground">Henüz departman bulunmuyor</p>
                        <p className="text-sm text-muted-foreground mt-1">Departman ekleyerek başlayın</p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredDepartmanlar.map((departman) => (
                  <TableRow key={departman.id}>
                    <TableCell className="font-medium">{departman.ad}</TableCell>
                    <TableCell>{departman.aciklama || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditDepartman(departman)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeletingDepartmentId(departman.id);
                            setDeleteDialogOpen(true);
                          }}
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
        </div>
      </CardContent>
      
      {/* Departman ekleme dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Departman Ekle</DialogTitle>
            <DialogDescription>
              Yeni bir departman oluşturmak için aşağıdaki bilgileri doldurun.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="departmanAdi" className="text-sm font-medium">
                Departman Adı
              </label>
              <Input
                id="departmanAdi"
                placeholder="Departman adını girin"
                value={yeniDepartman.ad}
                onChange={(e) => setYeniDepartman({...yeniDepartman, ad: e.target.value})}
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="departmanAciklama" className="text-sm font-medium">
                Açıklama (İsteğe Bağlı)
              </label>
              <Textarea
                id="departmanAciklama"
                placeholder="Departman açıklaması"
                value={yeniDepartman.aciklama || ''}
                onChange={(e) => setYeniDepartman({...yeniDepartman, aciklama: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setAddDialogOpen(false)}
              disabled={loading}
            >
              İptal
            </Button>
            <Button 
              onClick={handleAddDepartman}
              disabled={loading || !yeniDepartman.ad.trim()}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Ekleniyor...
                </>
              ) : (
                <>Ekle</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Departman düzenleme dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Departman Düzenle</DialogTitle>
            <DialogDescription>
              Departman bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateDepartman)} className="space-y-6">
              <FormField
                control={form.control}
                name="ad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departman Adı</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    form.reset();
                  }}
                  disabled={loading}
                >
                  İptal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Güncelleniyor...
                    </>
                  ) : (
                    <>Güncelle</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Departman silme onay dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Departmanı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu departmanı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>İptal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteDepartman}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Siliniyor...
                </>
              ) : (
                <>Sil</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
} 