"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TalepDosyalari } from "@/components/talepler/talep-dosyalari";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";
import {
  UserIcon,
  FileTextIcon,
  CalendarIcon,
  DollarSignIcon,
  CheckIcon,
  XIcon,
  ClockIcon,
} from "lucide-react";
import React from "react";

// Durum badge'inin rengini belirle
function getDurumBadgeVariant(durum: string) {
  switch (durum) {
    case "BEKLEMEDE":
      return "warning";
    case "ONAYLANDI":
      return "success";
    case "REDDEDILDI":
      return "destructive";
    case "SATINALMA_SURECINDE":
      return "secondary";
    case "TAMAMLANDI":
      return "success";
    case "IPTAL_EDILDI":
      return "destructive";
    default:
      return "outline";
  }
}

// Durum adını formatla
function formatDurum(durum: string): string {
  const durumMap: Record<string, string> = {
    "BEKLEMEDE": "Beklemede",
    "ONAYLANDI": "Onaylandı",
    "REDDEDILDI": "Reddedildi",
    "SATINALMA_SURECINDE": "Satınalma Sürecinde",
    "TAMAMLANDI": "Tamamlandı",
    "IPTAL_EDILDI": "İptal Edildi"
  };
  
  return durumMap[durum] || durum;
}

// Öncelik adını formatla
function formatOncelik(oncelik: string): string {
  const oncelikMap: Record<string, string> = {
    "DUSUK": "Düşük",
    "ORTA": "Orta",
    "YUKSEK": "Yüksek",
    "KRITIK": "Kritik"
  };
  
  return oncelikMap[oncelik] || oncelik;
}

// Tarih formatla
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR') + ' ' + date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

// Wrapper component that handles the params
export default function TalepDetayPage({ params }: { params: { id: string } }) {
  // Use React.use() to unwrap params according to Next.js requirements
  const resolvedParams = React.use(params as any) as { id: string };
  return <TalepDetaySayfasi id={resolvedParams.id} />;
}

// Main component that uses the id directly
function TalepDetaySayfasi({ id }: { id: string }) {
  const [talep, setTalep] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [onayLoading, setOnayLoading] = useState(false);
  const [redLoading, setRedLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchTalep = async () => {
      try {
        const response = await fetch(`/api/talepler/${id}`);
        if (!response.ok) {
          throw new Error('Talep bilgileri alınamadı');
        }
        
        const data = await response.json();
        if (data.success && data.data) {
          setTalep(data.data);
        } else {
          throw new Error(data.message || 'Talep bilgileri alınamadı');
        }
      } catch (error) {
        console.error('Talep detayı getirme hatası:', error);
        toast.error('Talep bilgileri yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTalep();
  }, [id]);
  
  // Kullanıcının onay yetkisi var mı kontrol et
  const canApprove = () => {
    if (!user || !talep) return false;
    
    // Admin her zaman onaylayabilir
    if (user.rol === 'ADMIN') return true;

    // Eğer kullanıcı talebin sahibi ve aynı zamanda bir yönetici rolüne sahipse
    const isRequestOwner = user.id === talep.talepEdenId;
    
    // Finans yöneticileri kendi taleplerini her zaman onaylayabilir
    if (isRequestOwner && user.rol === 'FINANS_ADMIN') {
      console.log('Finans yöneticisi kendi talebini onaylayabilir');
      return true;
    }
    
    // Diğer departman yöneticileri kendi taleplerini onaylayabilir
    if (isRequestOwner && 
        (user.rol === 'DEPARTMAN_YONETICISI' || 
         user.rol === 'IT_ADMIN' || 
         user.rol === 'SATINALMA_ADMIN')) {
      console.log('Departman yöneticisi kendi talebini onaylayabilir');
      return true;
    }
    
    // Bekleyen onay adımını bul
    const bekleyenOnay = getBekleyenOnayAdimi();
    if (!bekleyenOnay) return false;
    
    // Kullanıcının rolüne göre onay yetkisi kontrolü
    switch (bekleyenOnay.adim) {
      case 'DEPARTMAN_YONETICISI':
        // Departman yöneticileri kendi departmanlarındaki talepleri onaylayabilir
        return user.rol === 'DEPARTMAN_YONETICISI' && user.departmanId === talep.departmanId;
      case 'IT_DEPARTMANI':
        // IT yöneticileri IT onaylarını yapabilir
        return user.rol === 'IT_ADMIN';
      case 'FINANS_DEPARTMANI':
        // Finans yöneticileri Finans onaylarını yapabilir
        return user.rol === 'FINANS_ADMIN';
      case 'SATINALMA_DEPARTMANI':
        // Satınalma yöneticileri Satınalma onaylarını yapabilir
        return user.rol === 'SATINALMA_ADMIN';
      default:
        return false;
    }
  };
  
  // Bekleyen onay adımını bul
  const getBekleyenOnayAdimi = () => {
    if (!talep || !talep.onaylar) return null;
    
    // Sıradaki BEKLEMEDE olan adımı bul
    const bekleyenAdim = talep.onaylar.find((onay: any) => onay.durum === 'BEKLEMEDE');
    if (bekleyenAdim) return bekleyenAdim;
    
    // Eğer kullanıcı talep sahibi ve finans yöneticisi ise,
    // finans onay adımını döndür (durum ne olursa olsun)
    if (user && user.id === talep.talepEdenId && user.rol === 'FINANS_ADMIN') {
      const finansAdimi = talep.onaylar.find((onay: any) => onay.adim === 'FINANS_DEPARTMANI');
      if (finansAdimi) return finansAdimi;
    }
    
    // Özel durum: Kullanıcı kendi talebini mi onaylıyor?
    if (user && user.id === talep.talepEdenId) {
      // Kullanıcının rolüne göre hangi adımları onaylayabileceğini kontrol et
      if (user.rol === 'DEPARTMAN_YONETICISI') {
        const departmanAdimi = talep.onaylar.find((onay: any) => onay.adim === 'DEPARTMAN_YONETICISI');
        if (departmanAdimi) return departmanAdimi;
      }
      else if (user.rol === 'IT_ADMIN') {
        const itAdimi = talep.onaylar.find((onay: any) => onay.adim === 'IT_DEPARTMANI');
        if (itAdimi) return itAdimi;
      }
      else if (user.rol === 'FINANS_ADMIN') {
        const finansAdimi = talep.onaylar.find((onay: any) => onay.adim === 'FINANS_DEPARTMANI');
        if (finansAdimi) return finansAdimi;
      }
      else if (user.rol === 'SATINALMA_ADMIN') {
        const satinalmaAdimi = talep.onaylar.find((onay: any) => onay.adim === 'SATINALMA_DEPARTMANI');
        if (satinalmaAdimi) return satinalmaAdimi;
      }
    }
    
    return null;
  };
  
  // Onay işlemi
  const handleApprove = async () => {
    let onayAdimi = getBekleyenOnayAdimi();
    if (!onayAdimi) {
      // Eğer onaylanacak adım bulunmazsa, kullanıcının rolüne göre bir adım seç
      if (user?.rol === 'FINANS_ADMIN') {
        onayAdimi = talep?.onaylar?.find((onay: any) => onay.adim === 'FINANS_DEPARTMANI');
      } else if (user?.rol === 'IT_ADMIN') {
        onayAdimi = talep?.onaylar?.find((onay: any) => onay.adim === 'IT_DEPARTMANI');
      } else if (user?.rol === 'DEPARTMAN_YONETICISI') {
        onayAdimi = talep?.onaylar?.find((onay: any) => onay.adim === 'DEPARTMAN_YONETICISI');
      } else if (user?.rol === 'SATINALMA_ADMIN') {
        onayAdimi = talep?.onaylar?.find((onay: any) => onay.adim === 'SATINALMA_DEPARTMANI');
      }
    }
    
    if (!onayAdimi) {
      toast.error('Onaylanacak adım bulunamadı');
      return;
    }
    
    setOnayLoading(true);
    try {
      const response = await fetch(`/api/talepler/${id}/onay`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adim: onayAdimi.adim,
          durum: 'ONAYLANDI',
          aciklama: 'Onaylandı'
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Talep başarıyla onaylandı');
        // Sayfayı yenile
        router.refresh();
        // Talep verilerini güncelle
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        // API'den gelen hata mesajını göster
        toast.error(data.message || 'Onay işlemi başarısız oldu');
      }
    } catch (error: any) {
      console.error('Onay hatası:', error);
      // Hata mesajını göster
      toast.error(error.message || 'Onay işlemi sırasında bir hata oluştu');
    } finally {
      setOnayLoading(false);
    }
  };
  
  // Red işlemi
  const handleReject = async () => {
    let onayAdimi = getBekleyenOnayAdimi();
    if (!onayAdimi) {
      // Eğer onaylanacak adım bulunmazsa, kullanıcının rolüne göre bir adım seç
      if (user?.rol === 'FINANS_ADMIN') {
        onayAdimi = talep?.onaylar?.find((onay: any) => onay.adim === 'FINANS_DEPARTMANI');
      } else if (user?.rol === 'IT_ADMIN') {
        onayAdimi = talep?.onaylar?.find((onay: any) => onay.adim === 'IT_DEPARTMANI');
      } else if (user?.rol === 'DEPARTMAN_YONETICISI') {
        onayAdimi = talep?.onaylar?.find((onay: any) => onay.adim === 'DEPARTMAN_YONETICISI');
      } else if (user?.rol === 'SATINALMA_ADMIN') {
        onayAdimi = talep?.onaylar?.find((onay: any) => onay.adim === 'SATINALMA_DEPARTMANI');
      }
    }
    
    if (!onayAdimi) {
      toast.error('Reddedilecek adım bulunamadı');
      return;
    }
    
    setRedLoading(true);
    try {
      const response = await fetch(`/api/talepler/${id}/onay`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adim: onayAdimi.adim,
          durum: 'REDDEDILDI',
          aciklama: 'Reddedildi'
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Talep reddedildi');
        // Sayfayı yenile
        router.refresh();
        // Talep verilerini güncelle
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        // API'den gelen hata mesajını göster
        toast.error(data.message || 'Red işlemi başarısız oldu');
      }
    } catch (error: any) {
      console.error('Red hatası:', error);
      // Hata mesajını göster
      toast.error(error.message || 'Red işlemi sırasında bir hata oluştu');
    } finally {
      setRedLoading(false);
    }
  };
  
  if (loading) {
    return <div className="flex justify-center p-8">Yükleniyor...</div>;
  }
  
  if (!talep) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-4">Talep bulunamadı</h1>
        <Link href="/dashboard-all/talepler">
          <Button>Talepler Listesine Dön</Button>
        </Link>
      </div>
    );
  }
  
  const bekleyenOnay = getBekleyenOnayAdimi();
  const userCanApprove = canApprove();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Talep Detayları</h1>
          <p className="text-muted-foreground">
            {talep.id} numaralı talep bilgileri
          </p>
        </div>
        <Link href="/dashboard-all/talepler">
          <Button variant="outline">
            Talepler Listesine Dön
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{talep.baslik}</CardTitle>
                <CardDescription>{talep.departman?.ad} departmanı tarafından talep edildi</CardDescription>
              </div>
              <Badge variant={getDurumBadgeVariant(talep.durum) as any} className="ml-2">
                {formatDurum(talep.durum)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Talep Açıklaması</h3>
              <p className="text-sm text-muted-foreground">{talep.aciklama}</p>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Talep Eden</p>
                  <p className="text-sm font-medium">{talep.talepEden?.ad} {talep.talepEden?.soyad}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Departman</p>
                  <p className="text-sm font-medium">{talep.departman?.ad}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Talep Tarihi</p>
                  <p className="text-sm font-medium">{formatDate(talep.createdAt)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Ürünler</p>
                  <p className="text-sm font-medium">
                    {talep.urunTalepler?.map((ut: any) => 
                      `${ut.urun?.ad} (${ut.miktar} adet)`
                    ).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-4">
            <div className="flex items-center">
              <Badge variant="outline" className="mr-2">{formatOncelik(talep.oncelik)} Öncelik</Badge>
              <span className="text-xs text-muted-foreground">
                Oluşturulma: {formatDate(talep.createdAt)}
              </span>
            </div>
            
            {/* Finans yöneticileri veya diğer yetkili kullanıcılar için onay butonları */}
            {(userCanApprove || 
              (user && user.id === talep.talepEdenId && 
                (user.rol === 'FINANS_ADMIN' || 
                 user.rol === 'IT_ADMIN' || 
                 user.rol === 'DEPARTMAN_YONETICISI' || 
                 user.rol === 'SATINALMA_ADMIN' || 
                 user.rol === 'ADMIN'))) && (
              <div className="flex space-x-2">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleReject}
                  disabled={redLoading || onayLoading}
                >
                  {redLoading ? "İşleniyor..." : (
                    <>
                      <XIcon className="mr-1 h-4 w-4" />
                      Reddet
                    </>
                  )}
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={handleApprove}
                  disabled={redLoading || onayLoading}
                >
                  {onayLoading ? "İşleniyor..." : (
                    <>
                      <CheckIcon className="mr-1 h-4 w-4" />
                      Onayla
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Onay Süreci</CardTitle>
            <CardDescription>Talebin onay adımları</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {talep.onaylar?.map((onay: any) => (
                <div key={onay.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {onay.durum === 'ONAYLANDI' && (
                      <CheckIcon className="h-4 w-4 text-green-500" />
                    )}
                    {onay.durum === 'BEKLEMEDE' && (
                      <ClockIcon className="h-4 w-4 text-amber-500" />
                    )}
                    {onay.durum === 'REDDEDILDI' && (
                      <XIcon className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">
                      {onay.adim.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {onay.durum === 'BEKLEMEDE' 
                      ? 'Bekliyor' 
                      : onay.tarih ? formatDate(onay.tarih) : '-'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Dosya listesi */}
      <TalepDosyalari talepId={id} />
    </div>
  );
}