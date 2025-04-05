'use client';

import { useEffect, useState } from 'react';
import { TalepDetayDialog } from '@/components/talep-detay-dialog';
import { Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

interface Talep {
  id: string;
  talepNo: string;
  baslik: string;
  departman: {
    ad: string;
  };
  talepEden: {
    ad: string;
    soyad: string;
  };
  createdAt: string;
  durum: string;
  oncelik: string;
}

export default function TaleplerPage() {
  const [talepler, setTalepler] = useState<Talep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTalepId, setSelectedTalepId] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const fetchTalepler = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/talepler');
        if (!response.ok) {
          throw new Error('Talepler yüklenirken bir hata oluştu');
        }
        const data = await response.json();
        setTalepler(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchTalepler();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Bu talebi silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/talepler/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Talep silinirken bir hata oluştu');
      }

      setTalepler(talepler.filter((talep: Talep) => talep.id !== id));
    } catch (err) {
      console.error('Silme hatası:', err);
      alert('Talep silinirken bir hata oluştu');
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-medium mb-2">Hata</div>
          <div className="text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Talepler</h1>
        <Button onClick={() => router.push('/talepler/yeni')}>
          Yeni Talep Oluştur
        </Button>
      </div>

      <div className="bg-white rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Talep No</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Başlık</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Departman</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Talep Eden</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Tarih</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Durum</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Öncelik</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-b">
                    {Array.from({ length: 8 }).map((_, cellIndex) => (
                      <td key={cellIndex} className="py-3 px-4">
                        <Skeleton className="h-6 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                talepler.map((talep: Talep) => (
                  <tr key={talep.id} className="border-b">
                    <td className="py-3 px-4">T-{talep.id.slice(0, 8)}</td>
                    <td className="py-3 px-4">{talep.baslik}</td>
                    <td className="py-3 px-4">{talep.departman.ad}</td>
                    <td className="py-3 px-4">{`${talep.talepEden.ad} ${talep.talepEden.soyad}`}</td>
                    <td className="py-3 px-4">{new Date(talep.createdAt).toLocaleDateString('tr-TR')}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                        talep.durum === 'ONAYLANDI' ? 'bg-green-100 text-green-800' :
                        talep.durum === 'BEKLEMEDE' ? 'bg-yellow-100 text-yellow-800' :
                        talep.durum === 'REDDEDILDI' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {talep.durum}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                        talep.oncelik === 'YUKSEK' ? 'bg-red-100 text-red-800' :
                        talep.oncelik === 'ORTA' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {talep.oncelik}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedTalepId(talep.id)}
                          title="Detay Görüntüle"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {user?.rol === 'ADMIN' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(talep.id)}
                            title="Talebi Sil"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TalepDetayDialog
        talepId={selectedTalepId || ''}
        open={!!selectedTalepId}
        onOpenChange={(open) => !open && setSelectedTalepId(null)}
      />
    </div>
  );
} 