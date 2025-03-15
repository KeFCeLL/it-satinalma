"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  ShoppingCart,
  CheckCircle,
  Search,
  RefreshCw,
  FileText,
  AlertCircle,
  Clock,
  CheckCheck,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { getRequests, updateRequestApproval, getRequest } from "@/lib/services";
import { Request, RequestStatus } from "@/lib/services/request-service";
import { useAuth } from "@/lib/context/auth-context";
import { fetchWithAuth } from "@/lib/api";

export default function SatinalmaPage() {
  const [talepler, setTalepler] = useState<Request[]>([]);
  const [secilenTalep, setSecilenTalep] = useState<Request | null>(null);
  const [detayModalAcik, setDetayModalAcik] = useState(false);
  const [tamamlaModalAcik, setTamamlaModalAcik] = useState(false);
  const [aciklama, setAciklama] = useState("");
  const [yukleniyorListeleme, setYukleniyorListeleme] = useState(true);
  const [yukleniyorAksiyon, setYukleniyorAksiyon] = useState(false);
  const [aramaMetni, setAramaMetni] = useState("");
  const [aktifTab, setAktifTab] = useState<string>("surecte");
  const [hata, setHata] = useState<string | null>(null);
  
  const router = useRouter();
  const { user } = useAuth();
  
  // Satınalma yetkisi kontrolü
  const yetkiliKullanici = user?.rol === "ADMIN" || user?.rol === "SATINALMA_ADMIN";
  
  // Talepleri yükle
  const taleplerYukle = async () => {
    setYukleniyorListeleme(true);
    setHata(null);
    
    try {
      const params: any = {
        siralamaAlani: "createdAt",
        siralamaYonu: "desc"
      };
      
      if (aktifTab === "surecte") {
        params.durum = "SATINALMA_SURECINDE";
      } else if (aktifTab === "onaylandi") {
        params.durum = "ONAYLANDI";
        
        // Onaylanan adımları kontrol etmek için gerekli parametreleri ekle
        // API tarafında taleplerin doğru şekilde alınmasını sağlar
        params.onaylandi = true;
      } else if (aktifTab === "tamamlandi") {
        params.durum = "TAMAMLANDI";
      }
      
      console.log("Talep yükleme parametreleri:", params);
      const response = await getRequests(params);
      console.log("Yüklenen talepler:", response.data);
      setTalepler(response.data);
    } catch (error) {
      console.error("Talep listesi yüklenirken hata oluştu:", error);
      setHata("Talepler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setYukleniyorListeleme(false);
    }
  };
  
  // İlk yükleme ve tab değişikliklerinde talepleri getir
  useEffect(() => {
    taleplerYukle();
    
    // Sekme görünürlüğü değiştiğinde talepleri yenile
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        taleplerYukle();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [aktifTab]);
  
  // Arama yapıldığında filtreleme işlemi
  const filtrelenmisVeriler = talepler.filter(
    (talep) =>
      talep.baslik.toLowerCase().includes(aramaMetni.toLowerCase()) ||
      talep.id.toLowerCase().includes(aramaMetni.toLowerCase()) ||
      talep.departman?.ad.toLowerCase().includes(aramaMetni.toLowerCase()) ||
      `${talep.talepEden?.ad} ${talep.talepEden?.soyad}`.toLowerCase().includes(aramaMetni.toLowerCase())
  );
  
  // Satınalma sürecine alma işlemi
  const satinalmaBaslat = async (talepId: string) => {
    if (!yetkiliKullanici) {
      toast.error("Bu işlem için yetkiniz bulunmuyor");
      return;
    }
    
    setYukleniyorAksiyon(true);
    
    try {
      // Önce talep detaylarını getir
      const response = await getRequest(talepId);
      
      // API yanıtını kontrol et
      if (!response || !response.talep) {
        throw new Error("Talep bilgileri alınamadı");
      }
      
      const talep = response.talep;
      
      // Satınalma adımı var mı kontrol et
      const satinalmaAdimiVar = talep.onaylar?.some(
        onay => onay.adim === "SATINALMA_DEPARTMANI"
      );

      if (!satinalmaAdimiVar) {
        // Satınalma adımı eksikse, önce talep durumunu güncelleyelim
        // ONAYLANDI durumuna getirelim ki zaten onaylanmış olsun
        
        // Finans departmanı onayını kontrol et
        const finansOnaylandi = talep.onaylar?.some(
          onay => onay.adim === "FINANS_DEPARTMANI" && onay.durum === "ONAYLANDI"
        );
        
        if (!finansOnaylandi) {
          toast.error("Bu talebi satınalma sürecine almak için önce finans departmanı onayı gereklidir");
          setYukleniyorAksiyon(false);
          return;
        }
        
        // API'ye POST isteği yaparak satınalma adımı ekle
        console.log("Satınalma adımı ekleniyor...");
        const adimEkleResponse = await fetchWithAuth(`/api/talepler/${talepId}/adim-ekle`, {
          method: 'POST',
          body: JSON.stringify({
            adim: "SATINALMA_DEPARTMANI",
            durum: "BEKLEMEDE"
          }),
        });
        
        if (!adimEkleResponse.ok) {
          const errorData = await adimEkleResponse.json();
          console.error("Adım ekleme hatası:", errorData);
          throw new Error(errorData.message || "Satınalma adımı eklenirken bir hata oluştu");
        }
        
        console.log("Satınalma adımı başarıyla eklendi");
      }
      
      // Şimdi satınalma sürecini başlat
      console.log("Satınalma süreci başlatılıyor...");
      await updateRequestApproval(talepId, {
        adim: "SATINALMA_DEPARTMANI",
        durum: "SATINALMA_SURECINDE",
        aciklama: "Satınalma süreci başlatıldı",
      });
      
      toast.success("Satınalma süreci başlatıldı");
      taleplerYukle();
    } catch (error) {
      console.error("Satınalma sürecine alınırken hata oluştu:", error);
      toast.error("İşlem sırasında bir hata oluştu: " + (error instanceof Error ? error.message : "Bilinmeyen hata"));
    } finally {
      setYukleniyorAksiyon(false);
    }
  };
  
  // Talebi tamamlama işlemi
  const talebiTamamla = async () => {
    if (!secilenTalep || !yetkiliKullanici) return;
    
    setYukleniyorAksiyon(true);
    
    try {
      // Önce talep detaylarını getir
      const response = await getRequest(secilenTalep.id);
      
      // API yanıtını kontrol et
      if (!response || !response.talep) {
        throw new Error("Talep bilgileri alınamadı");
      }
      
      const talep = response.talep;
      
      // Satınalma adımı var mı kontrol et
      const satinalmaAdimiVar = talep.onaylar?.some(
        onay => onay.adim === "SATINALMA_DEPARTMANI"
      );

      if (!satinalmaAdimiVar) {
        // Satınalma adımı eksikse, hata ver
        throw new Error("Satınalma adımı bulunamadı. Önce satınalma sürecine alınması gerekiyor.");
      }
      
      console.log("Talep tamamlanıyor:", secilenTalep.id);
      await updateRequestApproval(secilenTalep.id, {
        adim: "SATINALMA_DEPARTMANI",
        durum: "TAMAMLANDI",
        aciklama: aciklama || "Satınalma tamamlandı",
      });
      
      toast.success("Talep başarıyla tamamlandı");
      setTamamlaModalAcik(false);
      setAciklama("");
      taleplerYukle();
    } catch (error) {
      console.error("Talep tamamlanırken hata oluştu:", error);
      toast.error("İşlem sırasında bir hata oluştu: " + (error instanceof Error ? error.message : "Bilinmeyen hata"));
    } finally {
      setYukleniyorAksiyon(false);
    }
  };
  
  // Talep detaylarını görüntüleme
  const talepDetayGoster = (talep: Request) => {
    setSecilenTalep(talep);
    setDetayModalAcik(true);
  };
  
  // Talep tamamlama modalını açma
  const tamamlaModalAc = (talep: Request) => {
    setSecilenTalep(talep);
    setTamamlaModalAcik(true);
  };
  
  // Durum badge'inin rengini belirleyen fonksiyon
  const getDurumBadgeVariant = (durum: RequestStatus) => {
    switch (durum) {
      case "BEKLEMEDE":
        return "outline";
      case "ONAYLANDI":
        return "secondary";
      case "TAMAMLANDI":
        return "success";
      case "REDDEDILDI":
        return "destructive";
      case "SATINALMA_SURECINDE":
        return "default";
      case "IPTAL_EDILDI":
        return "destructive";
      default:
        return "outline";
    }
  };
  
  // Durum adını formatla
  const formatDurum = (durum: RequestStatus): string => {
    const durumMap: Record<RequestStatus, string> = {
      "TASLAK": "Taslak",
      "BEKLEMEDE": "Onay Bekliyor",
      "ONAYLANDI": "Onaylandı",
      "REDDEDILDI": "Reddedildi",
      "SATINALMA_SURECINDE": "Satınalma Sürecinde",
      "TAMAMLANDI": "Tamamlandı",
      "IPTAL_EDILDI": "İptal Edildi"
    };
    return durumMap[durum] || durum;
  };
  
  // Para formatı
  const formatPara = (tutar: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(tutar);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Satınalma Yönetimi</h1>
          <p className="text-muted-foreground mt-1">
            Onaylanmış taleplerin satınalma süreçlerini takip edin ve yönetin
          </p>
        </div>
        <Button 
          onClick={taleplerYukle} 
          variant="outline"
          disabled={yukleniyorListeleme}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${yukleniyorListeleme ? "animate-spin" : ""}`} />
          Yenile
        </Button>
      </div>
      
      <Tabs defaultValue="surecte" value={aktifTab} onValueChange={setAktifTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="surecte" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Süreçtekiler</span>
            </TabsTrigger>
            <TabsTrigger value="onaylandi" className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              <span>Onaylanmış</span>
            </TabsTrigger>
            <TabsTrigger value="tamamlandi" className="flex items-center gap-1">
              <CheckCheck className="h-4 w-4" />
              <span>Tamamlananlar</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Talep ara..."
              className="pl-8"
              value={aramaMetni}
              onChange={(e) => setAramaMetni(e.target.value)}
            />
          </div>
        </div>
        
        <TabsContent value="surecte" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Satınalma Sürecindeki Talepler</CardTitle>
              <CardDescription>
                Satınalma süreci başlatılmış ve devam eden talepleri görüntüleyin
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hata ? (
                <div className="py-8 text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-destructive mb-2" />
                  <p className="text-red-500 mb-4">{hata}</p>
                  <Button onClick={taleplerYukle}>Yeniden Dene</Button>
                </div>
              ) : yukleniyorListeleme ? (
                <div className="py-8 text-center text-muted-foreground">
                  <div className="animate-spin mx-auto mb-4">
                    <RefreshCw className="h-8 w-8" />
                  </div>
                  Talepler yükleniyor...
                </div>
              ) : filtrelenmisVeriler.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <ShoppingCart className="mx-auto h-12 w-12 mb-4 opacity-20" />
                  <h3 className="text-lg font-medium mb-1">Satınalma Sürecinde Talep Yok</h3>
                  <p>Satınalma sürecine alınmış talep bulunmuyor.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Talep No</TableHead>
                      <TableHead className="w-[300px]">Başlık</TableHead>
                      <TableHead>Departman</TableHead>
                      <TableHead>Talep Eden</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtrelenmisVeriler.map((talep) => (
                      <TableRow key={talep.id}>
                        <TableCell className="font-medium">T-{talep.id.slice(0, 8)}</TableCell>
                        <TableCell>{talep.baslik}</TableCell>
                        <TableCell>{talep.departman?.ad}</TableCell>
                        <TableCell>{`${talep.talepEden?.ad || ""} ${talep.talepEden?.soyad || ""}`}</TableCell>
                        <TableCell>{format(new Date(talep.createdAt), "dd MMM yyyy", { locale: tr })}</TableCell>
                        <TableCell>
                          <Badge variant={getDurumBadgeVariant(talep.durum) as any}>
                            {formatDurum(talep.durum)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => talepDetayGoster(talep)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Detay
                          </Button>
                          {yetkiliKullanici && (
                            <Button 
                              variant="default" 
                              size="sm" 
                              onClick={() => tamamlaModalAc(talep)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Tamamla
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="onaylandi" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Onaylanmış Talepler</CardTitle>
              <CardDescription>
                Tüm onay süreçlerini tamamlamış, satınalma sürecine alınmayı bekleyen talepler
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hata ? (
                <div className="py-8 text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-destructive mb-2" />
                  <p className="text-red-500 mb-4">{hata}</p>
                  <Button onClick={taleplerYukle}>Yeniden Dene</Button>
                </div>
              ) : yukleniyorListeleme ? (
                <div className="py-8 text-center text-muted-foreground">
                  <div className="animate-spin mx-auto mb-4">
                    <RefreshCw className="h-8 w-8" />
                  </div>
                  Talepler yükleniyor...
                </div>
              ) : filtrelenmisVeriler.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <ShoppingCart className="mx-auto h-12 w-12 mb-4 opacity-20" />
                  <h3 className="text-lg font-medium mb-1">Onaylanmış Talep Yok</h3>
                  <p>Satınalma sürecine alınmayı bekleyen onaylanmış talep bulunmuyor.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Talep No</TableHead>
                      <TableHead className="w-[300px]">Başlık</TableHead>
                      <TableHead>Departman</TableHead>
                      <TableHead>Talep Eden</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtrelenmisVeriler.map((talep) => (
                      <TableRow key={talep.id}>
                        <TableCell className="font-medium">T-{talep.id.slice(0, 8)}</TableCell>
                        <TableCell>{talep.baslik}</TableCell>
                        <TableCell>{talep.departman?.ad}</TableCell>
                        <TableCell>{`${talep.talepEden?.ad || ""} ${talep.talepEden?.soyad || ""}`}</TableCell>
                        <TableCell>{format(new Date(talep.createdAt), "dd MMM yyyy", { locale: tr })}</TableCell>
                        <TableCell>
                          <Badge variant={getDurumBadgeVariant(talep.durum) as any}>
                            {formatDurum(talep.durum)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => talepDetayGoster(talep)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Detay
                          </Button>
                          {yetkiliKullanici && (
                            <Button 
                              variant="default" 
                              size="sm" 
                              onClick={() => satinalmaBaslat(talep.id)}
                              disabled={yukleniyorAksiyon}
                            >
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              Sürece Al
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tamamlandi" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Tamamlanan Talepler</CardTitle>
              <CardDescription>
                Satınalma süreci tamamlanmış talepler
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hata ? (
                <div className="py-8 text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-destructive mb-2" />
                  <p className="text-red-500 mb-4">{hata}</p>
                  <Button onClick={taleplerYukle}>Yeniden Dene</Button>
                </div>
              ) : yukleniyorListeleme ? (
                <div className="py-8 text-center text-muted-foreground">
                  <div className="animate-spin mx-auto mb-4">
                    <RefreshCw className="h-8 w-8" />
                  </div>
                  Talepler yükleniyor...
                </div>
              ) : filtrelenmisVeriler.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <ShoppingCart className="mx-auto h-12 w-12 mb-4 opacity-20" />
                  <h3 className="text-lg font-medium mb-1">Tamamlanan Talep Yok</h3>
                  <p>Tamamlanmış satınalma talebi bulunmuyor.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Talep No</TableHead>
                      <TableHead className="w-[300px]">Başlık</TableHead>
                      <TableHead>Departman</TableHead>
                      <TableHead>Talep Eden</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtrelenmisVeriler.map((talep) => (
                      <TableRow key={talep.id}>
                        <TableCell className="font-medium">T-{talep.id.slice(0, 8)}</TableCell>
                        <TableCell>{talep.baslik}</TableCell>
                        <TableCell>{talep.departman?.ad}</TableCell>
                        <TableCell>{`${talep.talepEden?.ad || ""} ${talep.talepEden?.soyad || ""}`}</TableCell>
                        <TableCell>{format(new Date(talep.createdAt), "dd MMM yyyy", { locale: tr })}</TableCell>
                        <TableCell>
                          <Badge variant={getDurumBadgeVariant(talep.durum) as any}>
                            {formatDurum(talep.durum)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => talepDetayGoster(talep)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Detay
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Talep Detay Modalı */}
      <Dialog open={detayModalAcik} onOpenChange={setDetayModalAcik}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {secilenTalep && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">Talep Detayı: {secilenTalep.baslik}</DialogTitle>
                <DialogDescription>
                  Talep No: T-{secilenTalep.id.slice(0, 8)}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-muted-foreground">Talep Eden</h4>
                    <p>{`${secilenTalep.talepEden?.ad || ""} ${secilenTalep.talepEden?.soyad || ""}`}</p>
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-muted-foreground">Departman</h4>
                    <p>{secilenTalep.departman?.ad}</p>
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-muted-foreground">Durum</h4>
                    <Badge variant={getDurumBadgeVariant(secilenTalep.durum) as any}>
                      {formatDurum(secilenTalep.durum)}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">Açıklama</h4>
                  <p className="whitespace-pre-wrap">{secilenTalep.aciklama}</p>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="mb-2 text-sm font-medium">Talep Edilen Ürünler</h4>
                  {secilenTalep.urunTalepler && secilenTalep.urunTalepler.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ürün</TableHead>
                          <TableHead>Miktar</TableHead>
                          <TableHead>Birim Fiyat</TableHead>
                          <TableHead className="text-right">Toplam Tutar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {secilenTalep.urunTalepler.map((urunTalep, index) => {
                          const urun = urunTalep.urun;
                          const toplam = urunTalep.miktar * (urunTalep.tutar || urun?.birimFiyat || 0);
                          
                          return (
                            <TableRow key={index}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{urun?.ad}</p>
                                  <p className="text-xs text-muted-foreground">Kategori: {urun?.kategori}</p>
                                </div>
                              </TableCell>
                              <TableCell>{urunTalep.miktar} {urun?.birim}</TableCell>
                              <TableCell>{formatPara(urunTalep.tutar || urun?.birimFiyat || 0)}</TableCell>
                              <TableCell className="text-right font-medium">{formatPara(toplam)}</TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow>
                          <TableCell colSpan={3} className="text-right font-bold">
                            Toplam Tutar:
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {formatPara(
                              secilenTalep.urunTalepler.reduce((toplam, urunTalep) => {
                                const birimFiyat = urunTalep.tutar || urunTalep.urun?.birimFiyat || 0;
                                return toplam + urunTalep.miktar * birimFiyat;
                              }, 0)
                            )}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground">Ürün bilgisi bulunmuyor</p>
                  )}
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="mb-2 text-sm font-medium">Onay Adımları</h4>
                  {secilenTalep.onaylar && secilenTalep.onaylar.length > 0 ? (
                    <div className="space-y-2">
                      {secilenTalep.onaylar.map((onay, index) => {
                        let durumBadge = "outline";
                        if (onay.durum === "ONAYLANDI") durumBadge = "success";
                        if (onay.durum === "REDDEDILDI") durumBadge = "destructive";
                        if (onay.durum === "BEKLEMEDE") durumBadge = "warning";
                        if (onay.durum === "SATINALMA_SURECINDE") durumBadge = "default";
                        if (onay.durum === "TAMAMLANDI") durumBadge = "success";
                        
                        let durumText = "Beklemede";
                        if (onay.durum === "ONAYLANDI") durumText = "Onaylandı";
                        if (onay.durum === "REDDEDILDI") durumText = "Reddedildi";
                        if (onay.durum === "SATINALMA_SURECINDE") durumText = "Satınalma Sürecinde";
                        if (onay.durum === "TAMAMLANDI") durumText = "Tamamlandı";
                        
                        let adimText = "Bilinmeyen Adım";
                        if (onay.adim === "DEPARTMAN_YONETICISI") adimText = "Departman Yöneticisi";
                        if (onay.adim === "IT_DEPARTMANI") adimText = "IT Departmanı";
                        if (onay.adim === "FINANS_DEPARTMANI") adimText = "Finans Departmanı";
                        if (onay.adim === "SATINALMA_DEPARTMANI") adimText = "Satınalma Departmanı";
                        
                        return (
                          <div 
                            key={index} 
                            className="flex justify-between items-center p-3 border rounded-md"
                          >
                            <div>
                              <h5 className="font-medium">{adimText}</h5>
                              {onay.onaylayan ? (
                                <p className="text-sm text-muted-foreground">
                                  {onay.onaylayan.ad} {onay.onaylayan.soyad}
                                  {onay.updatedAt && ` - ${format(new Date(onay.updatedAt), "dd MMM yyyy HH:mm", { locale: tr })}`}
                                </p>
                              ) : (
                                <p className="text-sm text-muted-foreground">Henüz işlem yapılmadı</p>
                              )}
                              {onay.aciklama && (
                                <p className="text-sm mt-1">{onay.aciklama}</p>
                              )}
                            </div>
                            <Badge variant={durumBadge as any}>{durumText}</Badge>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Onay bilgisi bulunmuyor</p>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setDetayModalAcik(false)}
                >
                  Kapat
                </Button>
                {secilenTalep.durum === "ONAYLANDI" && yetkiliKullanici && (
                  <Button 
                    onClick={() => {
                      setDetayModalAcik(false);
                      setTimeout(() => {
                        satinalmaBaslat(secilenTalep.id);
                      }, 100);
                    }}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Satınalma Sürecine Al
                  </Button>
                )}
                {secilenTalep.durum === "SATINALMA_SURECINDE" && yetkiliKullanici && (
                  <Button 
                    onClick={() => {
                      setDetayModalAcik(false);
                      setTimeout(() => {
                        tamamlaModalAc(secilenTalep);
                      }, 100);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Satınalmayı Tamamla
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Talebi Tamamlama Modalı */}
      <Dialog open={tamamlaModalAcik} onOpenChange={setTamamlaModalAcik}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Satınalma Sürecini Tamamla</DialogTitle>
            <DialogDescription>
              Bu talebin satınalma sürecini tamamlamak üzeresiniz. Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
                            <h3 className="text-sm font-medium mb-2">Talep: {secilenTalep?.baslik}</h3>
              <p className="text-sm text-muted-foreground">Talep No: T-{secilenTalep?.id.slice(0, 8)}</p>
            </div>
            
            <div className="space-y-4">
              <div className="grid w-full gap-1.5">
                <label htmlFor="aciklama" className="text-sm font-medium">
                  Tamamlama Açıklaması
                </label>
                <Textarea
                  id="aciklama"
                  placeholder="Satınalma süreci ile ilgili açıklama ekleyin..."
                  value={aciklama}
                  onChange={(e) => setAciklama(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setTamamlaModalAcik(false)}
              disabled={yukleniyorAksiyon}
            >
              İptal
            </Button>
            <Button 
              variant="default" 
              onClick={talebiTamamla}
              disabled={yukleniyorAksiyon}
            >
              {yukleniyorAksiyon ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  İşleniyor...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Tamamla
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}