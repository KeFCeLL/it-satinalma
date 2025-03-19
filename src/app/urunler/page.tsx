"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

// Ana sayfa bileşeni
export default function UrunlerPage() {
  // State'leri ekle
  const [kategoriler, setKategoriler] = useState<string[]>([]);
  const [kategoriSilmeModalOpen, setKategoriSilmeModalOpen] = useState(false);
  const [silinecekKategori, setSilinecekKategori] = useState<string | null>(null);
  const [silinecekKategoriUrunSayisi, setSilinecekKategoriUrunSayisi] = useState<number>(0);
  const [hedefKategori, setHedefKategori] = useState<string>('');
  const [kategoriTasimaLoading, setKategoriTasimaLoading] = useState(false);

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

  return (
    <div className="container mx-auto py-10">
      {/* Sayfa içeriği */}
      
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
      
      {/* Diğer bileşenler */}
    </div>
  );
} 