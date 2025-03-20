"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  PlusCircle, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Check,
  FilterX,
  Tag,
  Plus,
  RefreshCw
} from "lucide-react";
import { 
  getProducts, 
  getProductCategories, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  addProductCategory,
  deleteProductCategory,
  Product
} from "@/lib/services/product-service";

export function UrunYonetimiWrapper() {
  const [urunler, setUrunler] = useState<Product[]>([]);
  const [filtrelenmisUrunler, setFiltrelenmisUrunler] = useState<Product[]>([]);
  const [kategoriler, setKategoriler] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form durumları
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Kategori yönetimi
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [isDeleteCategoryDialogOpen, setIsDeleteCategoryDialogOpen] = useState(false); 
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categoryToDelete, setCategoryToDelete] = useState<string>("");
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  
  // Filtreler
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    ad: "",
    aciklama: "",
    kategori: "",
    birimFiyat: 0,
    birim: "Adet"
  });
  
  // Ürünleri ve kategorileri yükle
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);
  
  // Filtre değiştiğinde ürünleri filtrele
  useEffect(() => {
    try {
      if (!Array.isArray(urunler)) {
        console.warn("Filtreleme için geçerli ürünler dizisi bulunamadı");
        setFiltrelenmisUrunler([]);
        return;
      }
      
      filterProducts();
    } catch (error) {
      console.error("Filtreleme hatası:", error);
      // Hata durumunda orijinal listeyi göster
      setFiltrelenmisUrunler(Array.isArray(urunler) ? urunler : []);
    }
  }, [urunler, searchQuery, selectedCategory]);
  
  // Ürünleri getir
  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Ürünler yükleniyor...");
      
      const response = await getProducts({
        sayfa: 1,
        sayfaBasi: 100
      });
      
      if (!response || !response.data) {
        console.warn("API yanıtı boş veya veri içermiyor:", response);
        setUrunler([]);
        toast.error("Ürünler yüklenemedi");
        return;
      }
      
      const verifiedData = Array.isArray(response.data) ? response.data : [];
      console.log("Ürünler yüklendi, toplam:", verifiedData.length);
      
      setUrunler(verifiedData);
      setFiltrelenmisUrunler(verifiedData);
    } catch (err) {
      console.error("Ürünler yüklenirken hata oluştu:", err);
      setError("Ürünler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
      toast.error("Ürünler yüklenemedi");
      
      // Hata durumunda boş dizi ile devam et
      setUrunler([]);
      setFiltrelenmisUrunler([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Kategorileri getir
  const fetchCategories = async () => {
    setIsCategoryLoading(true);
    try {
      console.log("Kategoriler yükleniyor...");
      const response = await getProductCategories();
      console.log("API yanıtı:", response);
      
      // Kategori yanıtını doğrula
      const kategorilerListesi = Array.isArray(response.kategoriler) ? response.kategoriler : [];
      
      if (kategorilerListesi.length === 0) {
        console.warn("API yanıtında kategoriler bulunamadı veya boş:", response);
        // Varsayılan kategoriler (client tarafında)
        const varsayilanKategoriler = ["Donanım", "Yazılım", "Mobilya", "Kırtasiye", "Diğer"];
        setKategoriler(varsayilanKategoriler);
        toast.warning("Varsayılan kategoriler yüklendi");
      } else {
        console.log("Yüklenen kategoriler:", kategorilerListesi);
        setKategoriler(kategorilerListesi);
      }
    } catch (err) {
      console.error("Kategoriler yüklenirken hata oluştu:", err);
      toast.error("Kategoriler yüklenemedi, varsayılan kategoriler kullanılıyor");
      
      // Hata durumunda varsayılan kategoriler
      const varsayilanKategoriler = ["Donanım", "Yazılım", "Mobilya", "Kırtasiye", "Diğer"];
      setKategoriler(varsayilanKategoriler);
    } finally {
      setIsCategoryLoading(false);
    }
  };
  
  // Yeni kategori ekle
  const handleAddCategory = async () => {
    if (!newCategoryName || newCategoryName.trim() === "") {
      toast.error("Kategori adı boş olamaz");
      return;
    }
    
    setIsCategoryLoading(true);
    try {
      console.log("Kategori ekleme isteği gönderiliyor:", newCategoryName);
      
      const result = await addProductCategory(newCategoryName);
      
      if (result.success) {
        toast.success(result.message || "Kategori başarıyla eklendi");
        
        // API'den dönen kategorileri kullan, yoksa verileri yeniden çek
        if (Array.isArray(result.kategoriler) && result.kategoriler.length > 0) {
          setKategoriler(result.kategoriler);
        } else {
          await fetchCategories(); // Kategorileri yeniden yükle
        }
        
        setIsAddCategoryDialogOpen(false);
        setNewCategoryName("");
      } else {
        console.error("API hata yanıtı:", result.message, result);
        toast.error(result.message || "Kategori eklenemedi");
      }
    } catch (err) {
      console.error("Kategori eklenirken hata oluştu:", err);
      
      if (err instanceof Error) {
        toast.error(`Kategori eklenemedi: ${err.message}`);
      } else {
        toast.error("Kategori eklenemedi: Bilinmeyen bir hata oluştu");
      }
    } finally {
      setIsCategoryLoading(false);
    }
  };
  
  // Kategori sil
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) {
      toast.error("Silinecek kategori seçilmedi");
      return;
    }
    
    setIsCategoryLoading(true);
    try {
      console.log("Kategori silme isteği gönderiliyor:", categoryToDelete);
      
      const result = await deleteProductCategory(categoryToDelete);
      
      if (result.success) {
        toast.success(result.message || "Kategori başarıyla silindi");
        
        // API'den dönen kategorileri kullan, yoksa verileri yeniden çek
        if (Array.isArray(result.kategoriler) && result.kategoriler.length > 0) {
          setKategoriler(result.kategoriler);
        } else {
          await fetchCategories(); // Kategorileri yeniden yükle
        }
        
        // Kategori filtresini temizle
        if (selectedCategory === categoryToDelete) {
          setSelectedCategory("all");
        }
        
        setIsDeleteCategoryDialogOpen(false);
        setCategoryToDelete("");
      } else {
        console.error("API hata yanıtı:", result.message, result);
        toast.error(result.message || "Kategori silinemedi");
      }
    } catch (err) {
      console.error("Kategori silinirken hata oluştu:", err);
      
      if (err instanceof Error) {
        toast.error(`Kategori silinemedi: ${err.message}`);
      } else {
        toast.error("Kategori silinemedi: Bilinmeyen bir hata oluştu");
      }
    } finally {
      setIsCategoryLoading(false);
    }
  };
  
  // Ürünleri filtrele
  const filterProducts = () => {
    if (!Array.isArray(urunler)) {
      console.warn("Filtreleme için geçerli ürünler dizisi bulunamadı");
      setFiltrelenmisUrunler([]);
      return;
    }
    
    let filtered = [...urunler];
    
    // Arama filtresi
    if (searchQuery) {
      filtered = filtered.filter(urun => 
        (urun?.ad || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        ((urun?.aciklama || "").toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Kategori filtresi
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter(urun => urun?.kategori === selectedCategory);
    }
    
    setFiltrelenmisUrunler(filtered);
  };
  
  // Filtreleri temizle
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
  };
  
  // Form değişikliği
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let parsedValue: any = value;
    
    // Sayısal değerleri dönüştür
    if (name === "birimFiyat") {
      parsedValue = value === "" ? 0 : Number(value);
    }
    
    setFormData({
      ...formData,
      [name]: parsedValue
    });
  };
  
  // Ürün ekle dialog'unu aç
  const openAddDialog = () => {
    if (!kategoriler || kategoriler.length === 0) {
      // Kategoriler yüklenmediyse yeniden yüklemeyi dene
      fetchCategories();
      toast.warning("Kategoriler yükleniyor, lütfen bekleyin...");
      setTimeout(() => {
        if (kategoriler && kategoriler.length > 0) {
          setFormData({
            ad: "",
            aciklama: "",
            kategori: kategoriler[0],
            birimFiyat: 0,
            birim: "Adet"
          });
          setIsAddDialogOpen(true);
        } else {
          toast.error("Kategoriler yüklenemedi. Lütfen sayfayı yenileyin.");
        }
      }, 1000);
    } else {
      setFormData({
        ad: "",
        aciklama: "",
        kategori: kategoriler[0],
        birimFiyat: 0,
        birim: "Adet"
      });
      setIsAddDialogOpen(true);
    }
  };
  
  // Ürün düzenleme dialog'unu aç
  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      ad: product.ad,
      aciklama: product.aciklama || "",
      kategori: product.kategori,
      birimFiyat: product.birimFiyat,
      birim: product.birim
    });
    setIsEditDialogOpen(true);
  };
  
  // Ürün silme dialog'unu aç
  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };
  
  // Yeni ürün ekle
  const handleAddProduct = async () => {
    try {
      // Form alanlarını kontrol et
      if (!formData.ad || formData.ad.trim() === "") {
        toast.error("Ürün adı zorunludur");
        return;
      }
      
      if (!formData.kategori || formData.kategori === "loading") {
        toast.error("Lütfen geçerli bir kategori seçin");
        return;
      }
      
      if (!formData.birimFiyat || formData.birimFiyat <= 0) {
        toast.error("Birim fiyat 0'dan büyük olmalıdır");
        return;
      }
      
      // Yükleme durumunu göster
      setIsLoading(true);
      
      // API'ye gönderilecek veri
      const apiData = {
        ad: formData.ad.trim(),
        aciklama: formData.aciklama.trim(),
        kategori: formData.kategori,
        birimFiyat: Number(formData.birimFiyat),
        birim: formData.birim || 'Adet'
      };
      
      // Konsola gönderilecek verileri yazdır
      console.log("Ürün ekleme: Gönderilecek veriler", apiData);
      
      try {
        // Ürün ekleme isteği
        const result = await createProduct(apiData);
        console.log("Ürün ekleme başarılı, yanıt:", result);
        
        // Başarı mesajı göster
        toast.success("Ürün başarıyla eklendi");
        
        // Form dialogunu kapat
        setIsAddDialogOpen(false);
        
        // Ürün listesini yenile (gecikme ile - veritabanının güncellenmesini beklemek için)
        setTimeout(() => {
          console.log("Ürün listesi yenileniyor...");
          fetchProducts();
        }, 500);
      } catch (apiError) {
        console.error("Ürün ekleme API hatası:", apiError);
        
        if (apiError instanceof Error) {
          toast.error(`Ürün eklenemedi: ${apiError.message}`);
        } else {
          toast.error("Ürün eklenemedi: API hatası");
        }
      }
    } catch (err) {
      console.error("Ürün ekleme işlemi hatası:", err);
      
      // Hata mesajını daha anlaşılır şekilde göster
      if (err instanceof Error) {
        toast.error(`Ürün eklenemedi: ${err.message}`);
      } else {
        toast.error("Ürün eklenemedi: Bilinmeyen bir hata oluştu");
      }
    } finally {
      // İşlem tamamlandığında yükleme durumunu sıfırla
      setIsLoading(false);
    }
  };
  
  // Ürün güncelle
  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      if (!formData.ad || !formData.kategori || formData.birimFiyat <= 0) {
        toast.error("Lütfen zorunlu alanları doldurun");
        return;
      }
      
      const updateData = {
        ad: formData.ad,
        aciklama: formData.aciklama,
        kategori: formData.kategori,
        birimFiyat: formData.birimFiyat,
        birim: formData.birim || 'Adet'
      };
      
      console.log("Güncellenecek veriler:", updateData);
      
      try {
        const result = await updateProduct(selectedProduct.id, updateData);
        
        toast.success("Ürün başarıyla güncellendi");
        setIsEditDialogOpen(false);
        
        // Ürün listesini güncelle
        fetchProducts();
      } catch (apiError) {
        console.error("API hatası:", apiError);
        
        if (apiError instanceof Error) {
          toast.error(`Ürün güncellenemedi: ${apiError.message}`);
        } else {
          toast.error("Ürün güncellenemedi: API hatası");
        }
      }
    } catch (err) {
      console.error("Ürün güncellenirken hata oluştu:", err);
      
      if (err instanceof Error) {
        toast.error(`Ürün güncellenemedi: ${err.message}`);
      } else {
        toast.error("Ürün güncellenemedi: Bilinmeyen bir hata oluştu");
      }
    }
  };
  
  // Ürün sil
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      await deleteProduct(selectedProduct.id);
      
      toast.success("Ürün başarıyla silindi");
      setIsDeleteDialogOpen(false);
      
      // Ürün listesini güncelle
      fetchProducts();
    } catch (err) {
      console.error("Ürün silinirken hata oluştu:", err);
      toast.error("Ürün silinemedi");
    }
  };
  
  // Para formatı
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  return (
    <div className="space-y-6">
      {/* Kategori Yönetimi */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Kategori Yönetimi</CardTitle>
            <CardDescription>Ürün kategorilerini ekleyin veya silin</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={fetchCategories}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Yenile
            </Button>
            <Button onClick={() => setIsAddCategoryDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Kategori
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isCategoryLoading ? (
            <div className="flex justify-center p-4">Kategoriler yükleniyor...</div>
          ) : kategoriler.length === 0 ? (
            <div className="flex justify-center p-4">Henüz kategori bulunmuyor</div>
          ) : (
            <div className="flex flex-wrap gap-2 pb-4">
              {kategoriler.map((kategori, index) => (
                <div 
                  key={index} 
                  className="flex items-center rounded-md border border-input bg-background px-3 py-2"
                >
                  <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{kategori}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="ml-2 h-6 w-6"
                    onClick={() => {
                      setCategoryToDelete(kategori);
                      setIsDeleteCategoryDialogOpen(true);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Ürün Yönetimi */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Ürün Yönetimi</CardTitle>
            <CardDescription>Ürünleri ekleyin, düzenleyin veya silin</CardDescription>
          </div>
          <Button onClick={openAddDialog}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Yeni Ürün Ekle
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filtreler */}
          <div className="mb-4 flex items-center space-x-2">
            <div className="flex items-center space-x-2 flex-grow">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ürün ara..."
                className="max-w-sm"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {kategoriler && kategoriler.length > 0 ? (
                  kategoriler.map((kategori, index) => (
                    <SelectItem key={index} value={kategori}>
                      {kategori}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="loading" disabled>Kategoriler yükleniyor...</SelectItem>
                )}
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <FilterX className="mr-2 h-4 w-4" />
              Filtreleri Temizle
            </Button>
          </div>
          
          {/* Ürün tablosu */}
          {isLoading ? (
            <div className="flex justify-center p-4">Yükleniyor...</div>
          ) : error ? (
            <div className="flex justify-center p-4 text-red-500">{error}</div>
          ) : filtrelenmisUrunler.length === 0 ? (
            <div className="flex justify-center p-4">Ürün bulunamadı</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün Adı</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Birim Fiyat</TableHead>
                  <TableHead>Birim</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrelenmisUrunler.map((urun) => (
                  <TableRow key={urun.id}>
                    <TableCell className="font-medium">{urun.ad}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{urun.kategori}</Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(urun.birimFiyat)}</TableCell>
                    <TableCell>
                      <Badge variant={urun.birim ? "default" : "secondary"}>
                        {urun.birim || "Adet"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(urun)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(urun)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Ürün Ekleme Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Ürün Ekle</DialogTitle>
            <DialogDescription>
              Ürün bilgilerini girerek envantere yeni bir ürün ekleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ad" className="text-right">
                Ürün Adı*
              </Label>
              <Input
                id="ad"
                name="ad"
                value={formData.ad}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="aciklama" className="text-right">
                Açıklama
              </Label>
              <Textarea
                id="aciklama"
                name="aciklama"
                value={formData.aciklama}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="kategori" className="text-right">
                Kategori*
              </Label>
              <Select 
                name="kategori" 
                value={formData.kategori} 
                onValueChange={(val) => setFormData({...formData, kategori: val})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {kategoriler && kategoriler.length > 0 ? (
                    kategoriler.map((kategori, index) => (
                      <SelectItem key={index} value={kategori}>
                        {kategori}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="loading" disabled>Kategoriler yükleniyor...</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="birimFiyat" className="text-right">
                Birim Fiyat (₺)*
              </Label>
              <Input
                id="birimFiyat"
                name="birimFiyat"
                type="number"
                min="0"
                step="0.01"
                value={formData.birimFiyat}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="birim" className="text-right">
                Birim
              </Label>
              <Input
                id="birim"
                name="birim"
                value={formData.birim}
                onChange={handleFormChange}
                className="col-span-3"
                placeholder="Adet, Paket, Kutu vb."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              İptal
            </Button>
            <Button onClick={handleAddProduct}>
              <Check className="mr-2 h-4 w-4" />
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Ürün Düzenleme Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ürün Düzenle</DialogTitle>
            <DialogDescription>
              Ürün bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-ad" className="text-right">
                Ürün Adı*
              </Label>
              <Input
                id="edit-ad"
                name="ad"
                value={formData.ad}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-aciklama" className="text-right">
                Açıklama
              </Label>
              <Textarea
                id="edit-aciklama"
                name="aciklama"
                value={formData.aciklama}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-kategori" className="text-right">
                Kategori*
              </Label>
              <Select 
                name="kategori" 
                value={formData.kategori} 
                onValueChange={(val) => setFormData({...formData, kategori: val})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {kategoriler && kategoriler.length > 0 ? (
                    kategoriler.map((kategori, index) => (
                      <SelectItem key={index} value={kategori}>
                        {kategori}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="loading" disabled>Kategoriler yükleniyor...</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-birimFiyat" className="text-right">
                Birim Fiyat (₺)*
              </Label>
              <Input
                id="edit-birimFiyat"
                name="birimFiyat"
                type="number"
                min="0"
                step="0.01"
                value={formData.birimFiyat}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-birim" className="text-right">
                Birim
              </Label>
              <Input
                id="edit-birim"
                name="birim"
                value={formData.birim}
                onChange={handleFormChange}
                className="col-span-3"
                placeholder="Adet, Paket, Kutu vb."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              İptal
            </Button>
            <Button onClick={handleUpdateProduct}>
              <Check className="mr-2 h-4 w-4" />
              Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Ürün Silme Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ürün Sil</DialogTitle>
            <DialogDescription>
              Bu ürünü silmek istediğinizden emin misiniz?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>
              <strong>{selectedProduct?.ad}</strong> ürününü silmek üzeresiniz. 
              Bu işlem geri alınamaz.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduct}>
              <Trash2 className="mr-2 h-4 w-4" />
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Kategori Ekleme Dialog */}
      <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Kategori Ekle</DialogTitle>
            <DialogDescription>
              Ürünler için yeni bir kategori tanımlayın.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="kategori-adi" className="text-right">
                Kategori Adı*
              </Label>
              <Input
                id="kategori-adi"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="col-span-3"
                placeholder="Örn: Elektronik, Mobilya, Yazılım"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddCategoryDialogOpen(false);
              setNewCategoryName("");
            }}>
              <X className="mr-2 h-4 w-4" />
              İptal
            </Button>
            <Button onClick={handleAddCategory} disabled={isCategoryLoading}>
              {isCategoryLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Ekleniyor...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Ekle
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Kategori Silme Dialog */}
      <Dialog open={isDeleteCategoryDialogOpen} onOpenChange={setIsDeleteCategoryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kategori Sil</DialogTitle>
            <DialogDescription>
              Bu kategoriyi silmek istediğinizden emin misiniz?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>
              <strong>{categoryToDelete}</strong> kategorisini silmek üzeresiniz. 
              Bu kategoride ürünler varsa, silme işlemi gerçekleştirilemez.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDeleteCategoryDialogOpen(false);
              setCategoryToDelete("");
            }}>
              <X className="mr-2 h-4 w-4" />
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory} disabled={isCategoryLoading}>
              {isCategoryLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Sil
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 