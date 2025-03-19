import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";

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

// Şifre yenileme modalı için yeni bileşen
function SifreYenilemeModal({ kullanici, onSuccess }: { kullanici: Kullanici, onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [yeniSifre, setYeniSifre] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSifreYenile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/kullanicilar/${kullanici.id}/sifre-yenile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ yeniSifre }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Şifre yenileme işlemi başarısız oldu');
      }

      toast.success('Şifre başarıyla güncellendi');
      setIsOpen(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Şifre yenileme işlemi başarısız oldu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Şifre Yenile
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Şifre Yenileme</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="yeniSifre">Yeni Şifre</Label>
            <Input
              id="yeniSifre"
              type="password"
              value={yeniSifre}
              onChange={(e) => setYeniSifre(e.target.value)}
              placeholder="Yeni şifreyi girin"
            />
          </div>
          <Button 
            onClick={handleSifreYenile} 
            disabled={!yeniSifre || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Güncelleniyor...
              </>
            ) : (
              'Şifreyi Güncelle'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// İşlemler sütununu güncelle
const islemlerColumn = {
  id: "islemler",
  header: "İşlemler",
  cell: ({ row }: { row: { original: Kullanici } }) => {
    const kullanici = row.original;
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEdit(kullanici)}
        >
          Düzenle
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleDelete(kullanici.id)}
        >
          Sil
        </Button>
        <SifreYenilemeModal 
          kullanici={kullanici} 
          onSuccess={() => {
            // Gerekirse liste yenileme işlemi
          }} 
        />
      </div>
    );
  },
}; 