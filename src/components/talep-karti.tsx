'use client';

import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';

interface TalepKartiProps {
  talep: {
    id: string;
    baslik: string;
    aciklama: string;
    durum: string;
    oncelik: string;
    createdAt: string;
    departman: {
      ad: string;
    };
    talepEden: {
      ad: string;
      soyad: string;
    };
  };
}

export function TalepKarti({ talep }: TalepKartiProps) {
  const router = useRouter();

  const getDurumRenk = (durum: string) => {
    switch (durum) {
      case 'BEKLEMEDE':
        return 'bg-yellow-100 text-yellow-800';
      case 'ONAYLANDI':
        return 'bg-green-100 text-green-800';
      case 'REDDEDILDI':
        return 'bg-red-100 text-red-800';
      case 'SATINALMA_SURECINDE':
        return 'bg-blue-100 text-blue-800';
      case 'TAMAMLANDI':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOncelikRenk = (oncelik: string) => {
    switch (oncelik) {
      case 'YUKSEK':
        return 'bg-red-100 text-red-800';
      case 'ORTA':
        return 'bg-yellow-100 text-yellow-800';
      case 'DUSUK':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => router.push(`/talepler/${talep.id}`)}
    >
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold">{talep.baslik}</h2>
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded-full text-sm font-medium ${getDurumRenk(talep.durum)}`}>
            {talep.durum}
          </span>
          <span className={`px-2 py-1 rounded-full text-sm font-medium ${getOncelikRenk(talep.oncelik)}`}>
            {talep.oncelik}
          </span>
        </div>
      </div>

      <p className="text-gray-600 mb-4 line-clamp-2">{talep.aciklama}</p>

      <div className="flex justify-between items-center text-sm text-gray-500">
        <div>
          <span className="font-medium">Departman:</span> {talep.departman.ad}
        </div>
        <div>
          <span className="font-medium">Talep Eden:</span> {talep.talepEden.ad} {talep.talepEden.soyad}
        </div>
        <div>
          <span className="font-medium">Tarih:</span> {formatDate(talep.createdAt)}
        </div>
      </div>
    </div>
  );
} 