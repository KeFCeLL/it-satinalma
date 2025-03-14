"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clipboard, 
  FileCheck, 
  Clock,
  AlertTriangle,
  Eye
} from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";
import { getRequests, type Request, type ApprovalStep } from "@/lib/services";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Kendi RequestStatus tipimizi tanımlıyoruz
type RequestStatus = 
  | "TASLAK" 
  | "BEKLEMEDE" 
  | "ONAYLANDI" 
  | "REDDEDILDI" 
  | "TAMAMLANDI" 
  | "IPTAL_EDILDI"
  | "SATINALMA_SURECINDE";

export default function BekleyenlerPage() {
  const [bekleyenTalepler, setBekleyenTalepler] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchBekleyenTalepler = async () => {
      try {
        setLoading(true);
        const response = await getRequests({ durum: "BEKLEMEDE" });
        
        // Kullanıcının onayını bekleyen talepleri filtrele
        if (user) {
          let filteredTalepler: Request[] = [];
          
          response.data.forEach(talep => {
            // Onay adımlarını kontrol et
            const bekleyenOnay = talep.onaylar?.find(onay => 
              onay.durum === "BEKLEMEDE" && kullaniciOnaylayabilirMi(onay.adim)
            );
            
            if (bekleyenOnay) {
              filteredTalepler.push(talep);
            }
          });
          
          setBekleyenTalepler(filteredTalepler);
        }
      } catch (error) {
        console.error("Bekleyen talepler yüklenirken hata:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchBekleyenTalepler();
    }
  }, [user]);

  // Kullanıcının rolüne göre onaylayabileceği adımları kontrol et
  const kullaniciOnaylayabilirMi = (adim: ApprovalStep): boolean => {
    if (!user) return false;

    switch (adim) {
      case "DEPARTMAN_YONETICISI":
        return user.rol === "DEPARTMAN_YONETICISI" || user.rol === "ADMIN";
      case "IT_DEPARTMANI":
        return user.rol === "IT_ADMIN" || user.rol === "ADMIN";
      case "FINANS_DEPARTMANI":
        return user.rol === "FINANS_ADMIN" || user.rol === "ADMIN";
      case "SATINALMA_DEPARTMANI":
        return user.rol === "SATINALMA_ADMIN" || user.rol === "ADMIN";
      default:
        return false;
    }
  };

  // Durum badge'inin rengini belirle
  const getDurumBadgeVariant = (durum: RequestStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (durum) {
      case "BEKLEMEDE":
        return "default";
      case "ONAYLANDI":
        return "default";
      case "REDDEDILDI":
        return "destructive";
      case "SATINALMA_SURECINDE":
        return "secondary";
      case "TAMAMLANDI":
        return "default";
      case "IPTAL_EDILDI":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Durumu okunabilir formata çevir
  const formatDurum = (durum: RequestStatus): string => {
    switch (durum) {
      case "BEKLEMEDE":
        return "Beklemede";
      case "ONAYLANDI":
        return "Onaylandı";
      case "REDDEDILDI":
        return "Reddedildi";
      case "SATINALMA_SURECINDE":
        return "Satınalma Sürecinde";
      case "TAMAMLANDI":
        return "Tamamlandı";
      case "IPTAL_EDILDI":
        return "İptal Edildi";
      default:
        return durum;
    }
  };

  // Onay adımını okunabilir formata çevir
  const formatOnayAdimi = (adim: ApprovalStep): string => {
    switch (adim) {
      case "DEPARTMAN_YONETICISI":
        return "Departman Yöneticisi";
      case "IT_DEPARTMANI":
        return "IT Departmanı";
      case "FINANS_DEPARTMANI":
        return "Finans Departmanı";
      case "SATINALMA_DEPARTMANI":
        return "Satınalma Departmanı";
      default:
        return adim;
    }
  };

  // Talep detayına git
  const goToTalepDetay = (id: string) => {
    router.push(`/talepler/${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bekleyen Onaylar</h2>
          <p className="text-muted-foreground">
            Onayınızı bekleyen talepler burada listelenir.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("tr-TR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Onay Bekleyen Talepler</CardTitle>
          <CardDescription>
            Sizin onayınıza ihtiyaç duyan talepler aşağıda listelenmiştir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 rounded-md border p-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : bekleyenTalepler.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-8">
              <FileCheck className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Onayınızı Bekleyen Talep Yok</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Şu anda onayınızı bekleyen herhangi bir talep bulunmuyor.
              </p>
              <Button asChild>
                <Link href="/talepler">Tüm Talepleri Görüntüle</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {bekleyenTalepler.map((talep) => {
                const bekleyenOnay = talep.onaylar?.find(onay => 
                  onay.durum === "BEKLEMEDE" && kullaniciOnaylayabilirMi(onay.adim)
                );
                
                return (
                  <div key={talep.id} className="flex flex-col space-y-3 rounded-md border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          {talep.oncelik === "YUKSEK" || talep.oncelik === "KRITIK" ? (
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                          ) : (
                            <Clipboard className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">{talep.baslik}</h4>
                          <p className="text-xs text-muted-foreground">
                            {talep.talepEden?.ad} {talep.talepEden?.soyad} - {talep.departman?.ad}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getDurumBadgeVariant(talep.durum as RequestStatus)}>
                          {formatDurum(talep.durum as RequestStatus)}
                        </Badge>
                        <Badge variant="outline">
                          {formatOnayAdimi(bekleyenOnay?.adim || "DEPARTMAN_YONETICISI")}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <p className="line-clamp-2">{talep.aciklama}</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Talep Tarihi: {new Date(talep.createdAt).toLocaleDateString("tr-TR")}
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => goToTalepDetay(talep.id)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Detayları Görüntüle
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 