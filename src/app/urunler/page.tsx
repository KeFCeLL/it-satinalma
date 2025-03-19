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

// Ana sayfa bileşeni
export default function UrunlerPage() {
  // State'leri ekle
  const [kategoriler, setKategoriler] = useState<string[]>([]);
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [toplamUrunSayisi, setToplamUrunSayisi] = useState(0);
  const [sayfa, setSayfa] = useState(1);
  const [sayfaBasinaUrun, setSayfaBasinaUrun] = useState(10);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [kategoriSilmeModalOpen, setKategoriSilmeModalOpen] = useState(false);
  const [silinecekKategori, setSilinecekKategori] = useState<string | null>(null);
  const [silinecekKategoriUrunSayisi, setSilinecekKategoriUrunSayisi] = useState<number>(0);
  const [hedefKategori, setHedefKategori] = useState<string>('');
  const [kategoriTasimaLoading, setKategoriTasimaLoading] = useState(false);

  // Ürünleri getir
  const fetchUrunler = async () => {
    try {
      setYukleniyor(true);
      const response = await fetch(
        `/api/urunler?sayfa=${sayfa}&sayfaBasina=${sayfaBasinaUrun}`
      );
      const data = await response.json();
      
      if (data.success) {
        setUrunler(data.urunler);
        setToplamUrunSayisi(data.toplamUrunSayisi);
      } else {
        toast.error('Ürünler yüklenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Ürünler getirilirken hata:', error);
      toast.error('Ürünler yüklenirken bir hata oluştu');
    } finally {
      setYukleniyor(false);
    }
  };

  // Sayfa değiştiğinde ürünleri getir
  useEffect(() => {
    fetchUrunler();
  }, [sayfa, sayfaBasinaUrun]);

  // Kategorileri getir
  const fetchKategoriler = async () => {
    try {
      const response = await fetch('/api/urunler/kategoriler');
      const data = await response.json();
      if (data.success) {
        setKategoriler(data.data);
      }
    } catch (error) {
      console.error('Kategoriler getirilirken hata:', error);
      toast.error('Kategoriler yüklenirken bir hata oluştu');
    }
  };

  // Sayfa yüklendiğinde kategorileri getir
  useEffect(() => {
    fetchKategoriler();
  }, []);

  // Kategori silme fonksiyonunu güncelle
  const handleDeleteKategori = async (kategori: string) => {
    try {
      const response = await fetch(`/api/urunler/kategoriler?kategori=${encodeURIComponent(kategori)}`);
      const data = await response.json();

      if (!response.ok) {
        if (data.message?.includes('ürün bulunuyor')) {
          // Kategoride ürün varsa modalı göster
          setSilinecekKategori(kategori);
          setSilinecekKategoriUrunSayisi(parseInt(data.message.match(/\d+/)[0]));
          setKategoriSilmeModalOpen(true);
          return;
        }
        throw new Error(data.message || 'Kategori silinirken bir hata oluştu');
      }

      // Kategoride ürün yoksa direkt sil
      await fetch(`/api/urunler/kategoriler?kategori=${encodeURIComponent(kategori)}`, {
        method: 'DELETE',
      });

      // Kategorileri yenile
      fetchKategoriler();
      toast.success('Kategori başarıyla silindi');
    } catch (error) {
      console.error('Kategori silinirken hata:', error);
      toast.error(error instanceof Error ? error.message : 'Kategori silinirken bir hata oluştu');
    }
  };

  const handleKategoriTasima = async () => {
    if (!silinecekKategori || !hedefKategori) return;

    try {
      setKategoriTasimaLoading(true);
      const response = await fetch(`/api/urunler/kategoriler/${encodeURIComponent(silinecekKategori)}/urunler`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          yeniKategori: hedefKategori,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ürünler taşınırken bir hata oluştu');
      }

      // Kategorileri yenile
      fetchKategoriler();
      toast.success('Ürünler başarıyla taşındı');
      setKategoriSilmeModalOpen(false);
      setSilinecekKategori(null);
      setHedefKategori('');
    } catch (error) {
      console.error('Ürünler taşınırken hata:', error);
      toast.error(error instanceof Error ? error.message : 'Ürünler taşınırken bir hata oluştu');
    } finally {
      setKategoriTasimaLoading(false);
    }
  };

  // Toplam sayfa sayısını hesapla
  const toplamSayfa = Math.ceil(toplamUrunSayisi / sayfaBasinaUrun);

  return (
    <div className="container mx-auto py-10">
      {/* Ürün Listesi */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Ürün Yönetimi</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Sayfa başına:</span>
            <Select
              value={sayfaBasinaUrun.toString()}
              onValueChange={(value) => {
                setSayfaBasinaUrun(parseInt(value));
                setSayfa(1); // Sayfa başına ürün sayısı değiştiğinde ilk sayfaya dön
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
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün Adı</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Birim Fiyat</TableHead>
                  <TableHead>Birim</TableHead>
                  <TableHead>Açıklama</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {urunler.map((urun) => (
                  <TableRow key={urun.id}>
                    <TableCell>{urun.ad}</TableCell>
                    <TableCell>{urun.kategori}</TableCell>
                    <TableCell>{urun.birimFiyat.toLocaleString('tr-TR', {
                      style: 'currency',
                      currency: 'TRY'
                    })}</TableCell>
                    <TableCell>{urun.birim}</TableCell>
                    <TableCell>{urun.aciklama}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Sayfalama */}
            <div className="flex justify-center items-center space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setSayfa(s => Math.max(1, s - 1))}
                disabled={sayfa === 1}
              >
                Önceki
              </Button>
              <span className="text-sm">
                Sayfa {sayfa} / {toplamSayfa}
              </span>
              <Button
                variant="outline"
                onClick={() => setSayfa(s => Math.min(toplamSayfa, s + 1))}
                disabled={sayfa === toplamSayfa}
              >
                Sonraki
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Kategori Silme Modal */}
      <Dialog open={kategoriSilmeModalOpen} onOpenChange={setKategoriSilmeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kategori Silme Onayı</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              <span className="font-semibold">{silinecekKategori}</span> kategorisinde{' '}
              <span className="font-semibold">{silinecekKategoriUrunSayisi}</span> ürün bulunuyor.
              Bu ürünleri başka bir kategoriye taşımak ister misiniz?
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Hedef Kategori</label>
              <Select value={hedefKategori} onValueChange={setHedefKategori}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {kategoriler
                    .filter(k => k !== silinecekKategori)
                    .map((kategori) => (
                      <SelectItem key={kategori} value={kategori}>
                        {kategori}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setKategoriSilmeModalOpen(false);
                  setSilinecekKategori(null);
                  setHedefKategori('');
                }}
                disabled={kategoriTasimaLoading}
              >
                İptal
              </Button>
              <Button
                onClick={handleKategoriTasima}
                disabled={!hedefKategori || kategoriTasimaLoading}
              >
                {kategoriTasimaLoading ? (
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
    </div>
  );
} 