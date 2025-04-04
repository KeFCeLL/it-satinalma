'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';

interface Talep {
  id: string;
  baslik: string;
  aciklama: string;
  durum: string;
  oncelik: string;
  createdAt: string;
  tahminiTeslimTarihi: string;
  departman: {
    ad: string;
  };
  talepEden: {
    ad: string;
    soyad: string;
    email: string;
  };
  urunTalepler: {
    id: string;
    miktar: number;
    tutar: number;
    urun: {
      id: string;
      ad: string;
      birimFiyat: number;
    };
  }[];
  onaylar: {
    id: string;
    adim: string;
    durum: string;
    tarih: string | null;
    onaylayan: {
      ad: string;
      soyad: string;
      email: string;
    } | null;
  }[];
}

interface TalepDetayProps {
  talepId: string;
  isInModal?: boolean;
}

export function TalepDetay({ talepId, isInModal = false }: TalepDetayProps) {
  const router = useRouter();
  const [talep, setTalep] = useState<Talep | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTalep = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/talepler/${talepId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Talep bulunamadı');
          } else if (response.status === 401) {
            throw new Error('Bu sayfayı görüntülemek için giriş yapmanız gerekiyor');
          } else if (response.status === 403) {
            throw new Error('Bu talebi görüntüleme yetkiniz yok');
          } else {
            throw new Error('Talep detayları yüklenirken bir hata oluştu');
          }
        }
        const data = await response.json();
        setTalep(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchTalep();
  }, [talepId]);

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800 font-medium mb-2">Hata</div>
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!talep) {
    return <div className="text-gray-500">Talep bulunamadı.</div>;
  }

  return (
    <div className="space-y-6">
      {!isInModal && (
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">{talep.baslik}</h1>
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              talep.durum === 'ONAYLANDI' ? 'bg-green-100 text-green-800' :
              talep.durum === 'BEKLEMEDE' ? 'bg-yellow-100 text-yellow-800' :
              talep.durum === 'REDDEDILDI' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {talep.durum}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              talep.oncelik === 'YUKSEK' ? 'bg-red-100 text-red-800' :
              talep.oncelik === 'ORTA' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {talep.oncelik}
            </span>
          </div>
        </div>
      )}

      {isInModal && (
        <div className="flex justify-end items-center mb-4">
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              talep.durum === 'ONAYLANDI' ? 'bg-green-100 text-green-800' :
              talep.durum === 'BEKLEMEDE' ? 'bg-yellow-100 text-yellow-800' :
              talep.durum === 'REDDEDILDI' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {talep.durum === 'ONAYLANDI' ? 'ONAYLANDI' : talep.durum}
            </span>
          </div>
        </div>
      )}

      <div className={isInModal ? "" : "bg-white rounded-lg p-6"}>
        {isInModal && <h2 className="text-xl font-semibold mb-6">{talep.baslik}</h2>}

        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-base font-medium mb-4">Talep Bilgileri</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Departman</div>
                <div>{talep.departman.ad}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Talep Eden</div>
                <div>{talep.talepEden.ad} {talep.talepEden.soyad}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Email</div>
                <div>{talep.talepEden.email}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Oluşturulma Tarihi</div>
                <div>{formatDate(talep.createdAt)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Tahmini Teslim Tarihi</div>
                <div>{formatDate(talep.tahminiTeslimTarihi)}</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium mb-4">Açıklama</h3>
            <div className="text-sm whitespace-pre-wrap">{talep.aciklama}</div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-base font-medium mb-4">Ürün Talepleri</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">ÜRÜN</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">MİKTAR</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">BİRİM FİYAT</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">TOPLAM</th>
                </tr>
              </thead>
              <tbody>
                {talep.urunTalepler.map((urunTalep) => (
                  <tr key={urunTalep.id} className="border-b">
                    <td className="py-3">{urunTalep.urun.ad}</td>
                    <td className="py-3">{urunTalep.miktar}</td>
                    <td className="py-3">{urunTalep.urun.birimFiyat.toLocaleString('tr-TR')} TL</td>
                    <td className="py-3">{urunTalep.tutar.toLocaleString('tr-TR')} TL</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-base font-medium mb-4">Onay Durumu</h3>
          <div className="space-y-3">
            {talep.onaylar.map((onay) => (
              <div
                key={onay.id}
                className="flex items-center justify-between bg-gray-50 p-4 rounded"
              >
                <div>
                  <div className="font-medium">{onay.adim}</div>
                  {onay.onaylayan && (
                    <div className="text-sm text-gray-600">
                      {onay.onaylayan.ad} {onay.onaylayan.soyad} ({onay.onaylayan.email})
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    onay.durum === 'ONAYLANDI' ? 'bg-green-100 text-green-800' :
                    onay.durum === 'BEKLEMEDE' ? 'bg-yellow-100 text-yellow-800' :
                    onay.durum === 'REDDEDILDI' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {onay.durum}
                  </span>
                  {onay.tarih && (
                    <span className="text-sm text-gray-500">
                      {formatDate(onay.tarih)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 