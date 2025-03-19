import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Kategori silme modalı için yeni bileşen
function KategoriSilmeModal({ 
  isOpen, 
  onClose, 
  kategori, 
  urunSayisi,
  onConfirm 
}: { 
  isOpen: boolean;
  onClose: () => void;
  kategori: string;
  urunSayisi: number;
  onConfirm: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSil = async () => {
    try {
      setIsLoading(true);
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Kategori silinirken hata:', error);
    } finally {
      setIsLoading(false);
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
            <strong>{kategori}</strong> kategorisinde <strong>{urunSayisi}</strong> ürün bulunuyor.
            Bu kategoriyi silmek için önce ürünleri başka bir kategoriye taşımalı veya silmelisiniz.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleSil}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                'Ürünleri Sil ve Kategoriyi Sil'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Kategori silme fonksiyonunu güncelle
const handleKategoriSil = async (kategori: string) => {
  try {
    // Önce kategorideki ürün sayısını kontrol et
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

// State'leri ekle
const [kategoriSilmeModalOpen, setKategoriSilmeModalOpen] = useState(false);
const [silinecekKategori, setSilinecekKategori] = useState<string | null>(null);
const [silinecekKategoriUrunSayisi, setSilinecekKategoriUrunSayisi] = useState(0);

// ... existing code ...

// Modal'ı ekle
return (
  <div>
    {/* ... existing code ... */}
    
    <KategoriSilmeModal
      isOpen={kategoriSilmeModalOpen}
      onClose={() => {
        setKategoriSilmeModalOpen(false);
        setSilinecekKategori(null);
        setSilinecekKategoriUrunSayisi(0);
      }}
      kategori={silinecekKategori || ''}
      urunSayisi={silinecekKategoriUrunSayisi}
      onConfirm={async () => {
        if (!silinecekKategori) return;
        
        // Önce ürünleri sil
        await fetch(`/api/urunler/kategoriler/${encodeURIComponent(silinecekKategori)}/urunler`, {
          method: 'DELETE',
        });
        
        // Sonra kategoriyi sil
        await fetch(`/api/urunler/kategoriler?kategori=${encodeURIComponent(silinecekKategori)}`, {
          method: 'DELETE',
        });
        
        // Kategorileri yenile
        fetchKategoriler();
        toast.success('Kategori ve içindeki ürünler başarıyla silindi');
      }}
    />
    
    {/* ... existing code ... */}
  </div>
); 