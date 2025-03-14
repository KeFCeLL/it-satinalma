"use client"

import { useEffect, useState } from "react"
import { EyeIcon, RefreshCw, Trash2, AlertCircle } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
} from "@/components/ui/alert-dialog"
import { TalepFiltrele, TalepFiltresi } from "./talep-filtrele"
import { getRequests, cancelRequest } from "@/lib/services"
import { 
  Request, 
  RequestPriority, 
  RequestStatus 
} from "@/lib/services/request-service"
import { useAuth } from "@/lib/context/auth-context"

// Durum badge'inin rengini belirleyen fonksiyon
function getDurumBadgeVariant(durum: RequestStatus) {
  switch (durum) {
    case "BEKLEMEDE":
      return "outline"
    case "ONAYLANDI":
      return "secondary"
    case "TAMAMLANDI":
      return "success"
    case "REDDEDILDI":
      return "destructive"
    case "SATINALMA_SURECINDE":
      return "default"
    case "IPTAL_EDILDI":
      return "destructive"
    default:
      return "outline"
  }
}

// Durum adını formatla
function formatDurum(durum: RequestStatus): string {
  const durumMap: Record<RequestStatus, string> = {
    "TASLAK": "Taslak",
    "BEKLEMEDE": "Onay Bekliyor",
    "ONAYLANDI": "Onaylandı",
    "REDDEDILDI": "Reddedildi",
    "SATINALMA_SURECINDE": "Satınalma Sürecinde",
    "TAMAMLANDI": "Tamamlandı",
    "IPTAL_EDILDI": "İptal Edildi"
  }
  return durumMap[durum] || durum
}

// Öncelik adını formatla
function formatOncelik(oncelik: RequestPriority): string {
  const oncelikMap: Record<RequestPriority, string> = {
    "DUSUK": "Düşük",
    "ORTA": "Orta",
    "YUKSEK": "Yüksek",
    "KRITIK": "Kritik"
  }
  return oncelikMap[oncelik] || oncelik
}

export function TalepFiltrelemeWrapper() {
  const [talepler, setTalepler] = useState<Request[]>([])
  const [filtrelenmisVeriler, setFiltrelenmisVeriler] = useState<Request[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [silinecekTalepId, setSilinecekTalepId] = useState<string | null>(null)
  const [silmeModalAcik, setSilmeModalAcik] = useState(false)
  const [silmeIslemi, setSilmeIslemi] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  
  // Admin kontrolü
  const isAdmin = user?.rol === "ADMIN"
  
  // Talepleri güncelleyen fonksiyon
  const fetchTalepler = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await getRequests({
        sayfa: 1,
        sayfaBasi: 50,
        siralamaAlani: "createdAt",
        siralamaYonu: "desc"
      })
      
      setTalepler(response.data)
      setFiltrelenmisVeriler(response.data)
    } catch (err) {
      console.error("Talepler yüklenirken hata oluştu:", err)
      setError("Talepler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
    } finally {
      setIsLoading(false)
    }
  }
  
  // API'den talepleri yükle
  useEffect(() => {
    // İlk yükleme
    fetchTalepler()
    
    // Visibility değişimini dinle - kullanıcı sekmeye geri dönerse verileri güncelle
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && pathname === '/talepler') {
        fetchTalepler()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [pathname])
  
  const handleFilterChange = (filters: TalepFiltresi) => {
    // Yeni API sorgusu yapalım
    const fetchFilteredTalepler = async () => {
      setIsLoading(true)
      
      try {
        // API parametreleri hazırla
        const params: any = {
          sayfa: 1,
          sayfaBasi: 50,
          siralamaAlani: "createdAt",
          siralamaYonu: "desc"
        }
        
        // Arama filtresi
        if (filters.arama) {
          params.arama = filters.arama
        }
        
        // Durum filtresi
        if (filters.durum && filters.durum !== "all") {
          const durumMap: Record<string, RequestStatus> = {
            "onay-bekliyor": "BEKLEMEDE",
            "onaylandi": "ONAYLANDI",
            "tamamlandi": "TAMAMLANDI",
            "reddedildi": "REDDEDILDI",
            "satinalma": "SATINALMA_SURECINDE",
            "iptal": "IPTAL_EDILDI"
          }
          
          params.durum = durumMap[filters.durum]
        }
        
        // Departman filtresi
        if (filters.departman && filters.departman !== "all") {
          params.departmanId = filters.departman
        }
        
        // Tarih filtresi
        if (filters.tarihBaslangic) {
          params.baslangicTarihi = filters.tarihBaslangic.toISOString()
          
          if (filters.tarihBitis) {
            params.bitisTarihi = filters.tarihBitis.toISOString()
          }
        }
        
        const response = await getRequests(params)
        setFiltrelenmisVeriler(response.data)
      } catch (err) {
        console.error("Filtrelenmiş talepler yüklenirken hata oluştu:", err)
        setError("Talepler filtrelenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchFilteredTalepler()
  }
  
  // Talep silme işlemi
  const handleTalepSil = async () => {
    if (!silinecekTalepId) return;
    
    try {
      setSilmeIslemi(true);
      
      const response = await cancelRequest(silinecekTalepId);
      
      if (response.success) {
        toast.success("Talep başarıyla silindi");
        // Silinen talebi listeden çıkar
        setTalepler(talepler.filter(t => t.id !== silinecekTalepId));
        setFiltrelenmisVeriler(filtrelenmisVeriler.filter(t => t.id !== silinecekTalepId));
      } else {
        throw new Error("Talep silme işlemi başarısız oldu");
      }
    } catch (error) {
      console.error("Talep silme hatası:", error);
      toast.error("Talep silinirken bir hata oluştu");
    } finally {
      setSilmeIslemi(false);
      setSilmeModalAcik(false);
      setSilinecekTalepId(null);
    }
  };
  
  // Silme modalını açar
  const silmeModalAc = (talepId: string) => {
    setSilinecekTalepId(talepId);
    setSilmeModalAcik(true);
  };
  
  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Yeniden Dene</Button>
      </div>
    )
  }
  
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <TalepFiltrele onFilterChange={handleFilterChange} />
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchTalepler}
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Yenile
        </Button>
      </div>
      
      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">
          Talepler yükleniyor...
        </div>
      ) : filtrelenmisVeriler.length === 0 ? (
        <div className="py-6 text-center text-muted-foreground">
          Arama kriterlerinize uygun talep bulunamadı.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Talep No</TableHead>
                <TableHead className="min-w-[200px]">Başlık</TableHead>
                <TableHead>Departman</TableHead>
                <TableHead>Talep Eden</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Öncelik</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrelenmisVeriler.map((talep) => (
                <TableRow key={talep.id}>
                  <TableCell className="font-medium">T-{talep.id.slice(0, 8)}</TableCell>
                  <TableCell>{talep.baslik}</TableCell>
                  <TableCell>{talep.departman?.ad}</TableCell>
                  <TableCell>{`${talep.talepEden?.ad || ''} ${talep.talepEden?.soyad || ''}`}</TableCell>
                  <TableCell>{format(new Date(talep.createdAt), "dd MMM yyyy", { locale: tr })}</TableCell>
                  <TableCell>
                    <Badge variant={getDurumBadgeVariant(talep.durum) as any}>
                      {formatDurum(talep.durum)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatOncelik(talep.oncelik)}</TableCell>
                  <TableCell className="text-right flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" asChild title="Detay Görüntüle">
                      <a href={`/talepler/${talep.id}`}>
                        <EyeIcon className="h-4 w-4" />
                      </a>
                    </Button>
                    
                    {/* Sadece Admin kullanıcılara talep silme butonu göster */}
                    {isAdmin && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => silmeModalAc(talep.id)}
                        title="Talebi Sil"
                        className="text-destructive hover:text-destructive/90"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Talep Silme Onay Modalı */}
      <AlertDialog open={silmeModalAcik} onOpenChange={setSilmeModalAcik}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Talebi Silmek İstediğinize Emin Misiniz?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bu talep ve ilişkili tüm bilgiler kalıcı olarak silinecektir.
              Bu talebi silmek, tüm onay geçmişini ve dosyaları da silecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={silmeIslemi}>İptal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault(); // Formun varsayılan davranışını engelle
                handleTalepSil();
              }}
              disabled={silmeIslemi}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {silmeIslemi ? "Siliniyor..." : "Evet, Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 