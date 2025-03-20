"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Custom ErrorBoundary component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div>Bir hata oluştu, lütfen sayfayı yenileyin.</div>;
    }
    return this.props.children;
  }
}

// Kullanıcı tipi tanımı
interface Kullanici {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  departmanId: string;
  rol: string;
  durum: string;
  createdAt: Date;
  updatedAt: Date;
  departman?: {
    id: string;
    ad: string;
  };
}

// Ürün tipi tanımı
interface Urun {
  id: string;
  ad: string;
  kategori: string;
  birimFiyat: number;
  birim: string;
  aciklama: string;
  createdAt: Date;
  updatedAt: Date;
}

interface KategoriSilmeModalProps {
  isOpen: boolean;
  onClose: () => void;
  kategori: string | null;
  urunSayisi: number;
  kategoriler: string[];
  onTasima: (hedefKategori: string) => Promise<void>;
}

// Kategori Silme Modal Bileşeni
function KategoriSilmeModal({
  isOpen,
  onClose,
  kategori,
  urunSayisi,
  kategoriler,
  onTasima,
}: KategoriSilmeModalProps) {
  const [hedefKategori, setHedefKategori] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleTasima = async () => {
    if (!hedefKategori) return;
    try {
      setLoading(true);
      await onTasima(hedefKategori);
      onClose();
    } catch (error) {
      console.error('Taşıma hatası:', error);
      toast.error('Ürünler taşınırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kategori Silme Onayı</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>
            <span className="font-semibold">{kategori}</span> kategorisinde{' '}
            <span className="font-semibold">{urunSayisi}</span> ürün bulunuyor.
            Bu ürünleri başka bir kategoriye taşımak ister misiniz?
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium">Hedef Kategori</label>
            <Select value={hedefKategori} onValueChange={setHedefKategori}>
              <SelectTrigger>
                <SelectValue placeholder="Kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(kategoriler) && kategoriler.length > 0 ? (
                  kategoriler
                    .filter(k => k !== kategori)
                    .map((k) => (
                      <SelectItem key={k} value={k}>
                        {k}
                      </SelectItem>
                    ))
                ) : (
                  <SelectItem value="" disabled>
                    Kategori bulunamadı
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              İptal
            </Button>
            <Button
              onClick={handleTasima}
              disabled={!hedefKategori || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Taşınıyor...
                </>
              ) : (
                'Taşı ve Sil'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Ana sayfa bileşeni
export default function UrunlerPage() {
  // State'leri ekle
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [toplamUrunSayisi, setToplamUrunSayisi] = useState(0);
  const [sayfa, setSayfa] = useState(1);
  const [sayfaBasinaUrun, setSayfaBasinaUrun] = useState(10);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [kategoriler, setKategoriler] = useState<string[]>([]);
  const [kategoriYukleniyor, setKategoriYukleniyor] = useState(false);
  const [kategoriHata, setKategoriHata] = useState<string | null>(null);
  const [kategoriSilmeModal, setKategoriSilmeModal] = useState<{
    isOpen: boolean;
    kategori: string | null;
    urunSayisi: number;
  }>({
    isOpen: false,
    kategori: null,
    urunSayisi: 0,
  });

  // Ürünleri getir
  const fetchUrunler = async () => {
    try {
      setYukleniyor(true);
      setHata(null);
      console.log('Ürünler getiriliyor...');
      
      const response = await fetch(`/api/urunler?sayfa=${sayfa}&sayfaBasi=${sayfaBasinaUrun}`);
      
      // Eğer başarısız olursa, hatayı yakala ama sayfayı çökertme
      if (!response.ok) {
        console.warn(`API yanıtı başarısız: ${response.status} ${response.statusText}`);
        setHata(`Ürünler yüklenirken bir hata oluştu (${response.status})`);
        setUrunler([]);
        setToplamUrunSayisi(0);
        return;
      }

      let data;
      try {
        data = await response.json();
        console.log('Ürünler yanıtı:', data);
      } catch (jsonError) {
        console.error('JSON çözümleme hatası:', jsonError);
        setHata('API yanıtı beklenmeyen formatta');
        setUrunler([]);
        setToplamUrunSayisi(0);
        return;
      }

      // Yanıt yapısını daha ayrıntılı kontrol et
      if (!data) {
        console.warn('API yanıtı boş');
        setUrunler([]);
        setToplamUrunSayisi(0);
        return;
      }

      // Ürünler dizisi kontrolü - hem success hem de urunler özelliklerini kontrol et
      const urunlerVerisi = Array.isArray(data.urunler) 
        ? data.urunler 
        : (Array.isArray(data.data) ? data.data : []);

      console.log('İşlenen ürünler:', urunlerVerisi);
      setUrunler(urunlerVerisi);
      setToplamUrunSayisi(data.toplamUrunSayisi || urunlerVerisi.length || 0);

    } catch (error) {
      console.error('Ürünler getirilirken hata:', error);
      setHata(error instanceof Error ? error.message : 'Ürünler yüklenirken bir hata oluştu');
      setUrunler([]);
      setToplamUrunSayisi(0);
    } finally {
      setYukleniyor(false);
    }
  };

  // Kategorileri getir
  const fetchKategoriler = async () => {
    try {
      setKategoriYukleniyor(true);
      setKategoriHata(null);
      
      const response = await fetch('/api/urunler/kategoriler');
      
      // Eğer başarısız olursa, hatayı yakala ama sayfayı çökertme
      if (!response.ok) {
        console.warn(`Kategoriler API yanıtı başarısız: ${response.status} ${response.statusText}`);
        setKategoriHata(`Kategoriler yüklenirken bir hata oluştu (${response.status})`);
        setKategoriler([]);
        return;
      }

      let data;
      try {
        data = await response.json();
        console.log('Kategoriler yanıtı:', data);
      } catch (jsonError) {
        console.error('Kategoriler JSON çözümleme hatası:', jsonError);
        setKategoriHata('Kategoriler API yanıtı beklenmeyen formatta');
        setKategoriler([]);
        return;
      }
      
      // Veri yapısını kontrol et ve güvenli bir şekilde kategorileri ayarla
      let kategorilerListesi: string[] = [];
      
      if (data && data.success && Array.isArray(data.data)) {
        kategorilerListesi = data.data;
      } else if (data && Array.isArray(data.data)) {
        kategorilerListesi = data.data;
      } else if (data && Array.isArray(data.kategoriler)) {
        kategorilerListesi = data.kategoriler;
      } else if (Array.isArray(data)) {
        kategorilerListesi = data;
      } else {
        console.warn('Kategoriler API beklenmeyen format döndürdü', data);
        kategorilerListesi = [];
      }
      
      console.log('İşlenen kategoriler:', kategorilerListesi);
      setKategoriler(kategorilerListesi);
      
    } catch (error) {
      console.error('Kategoriler getirilirken hata:', error);
      setKategoriHata(error instanceof Error ? error.message : 'Kategoriler yüklenirken bir hata oluştu');
      setKategoriler([]);
    } finally {
      setKategoriYukleniyor(false);
    }
  };

  // Sayfa yüklendiğinde verileri getir
  useEffect(() => {
    fetchUrunler();
    fetchKategoriler();
  }, []);

  // Sayfa veya sayfa başına ürün sayısı değiştiğinde ürünleri getir
  useEffect(() => {
    if (sayfa > 0) {
      fetchUrunler();
    }
  }, [sayfa, sayfaBasinaUrun]);

  // Toplam sayfa sayısını hesapla
  const toplamSayfa = Math.max(1, Math.ceil(toplamUrunSayisi / sayfaBasinaUrun));

  // Render
  return (
    <div className="container mx-auto py-10">
      <ErrorBoundary>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Ürün Yönetimi</h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Sayfa başına:</span>
              <Select
                value={sayfaBasinaUrun.toString()}
                onValueChange={(value) => {
                  setSayfaBasinaUrun(Number(value));
                  setSayfa(1);
                }}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {yukleniyor ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : hata ? (
            <div className="flex justify-center items-center h-64 text-red-500">
              {hata}
            </div>
          ) : !Array.isArray(urunler) || urunler.length === 0 ? (
            <div className="flex justify-center items-center h-64 text-gray-500">
              Henüz ürün bulunmuyor
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ürün Adı</TableHead>
                      <TableHead>Birim Fiyat</TableHead>
                      <TableHead>Birim</TableHead>
                      <TableHead>Açıklama</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(urunler) ? urunler : []).map((urun) => (
                      <TableRow key={urun?.id || 'unknown'}>
                        <TableCell>{urun?.ad || '-'}</TableCell>
                        <TableCell>
                          {urun?.birimFiyat
                            ? new Intl.NumberFormat('tr-TR', {
                                style: 'currency',
                                currency: 'TRY',
                              }).format(urun.birimFiyat)
                            : '-'}
                        </TableCell>
                        <TableCell>{urun?.birim || '-'}</TableCell>
                        <TableCell>{urun?.aciklama || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {toplamUrunSayisi > 0 && (
                <div className="flex justify-center items-center space-x-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setSayfa((s) => Math.max(1, s - 1))}
                    disabled={sayfa === 1}
                  >
                    Önceki
                  </Button>
                  <span className="text-sm">
                    Sayfa {sayfa} / {toplamSayfa}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setSayfa((s) => Math.min(toplamSayfa, s + 1))}
                    disabled={sayfa === toplamSayfa}
                  >
                    Sonraki
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </ErrorBoundary>
    </div>
  );
} 