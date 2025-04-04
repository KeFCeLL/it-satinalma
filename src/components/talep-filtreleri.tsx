'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export function TalepFiltreleri() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/talepler?${params.toString()}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Arama
        </label>
        <input
          type="text"
          placeholder="Talep ara..."
          className="w-full px-3 py-2 border rounded-md"
          value={searchParams.get('arama') || ''}
          onChange={(e) => handleFilterChange('arama', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Durum
        </label>
        <select
          className="w-full px-3 py-2 border rounded-md"
          value={searchParams.get('durum') || ''}
          onChange={(e) => handleFilterChange('durum', e.target.value)}
        >
          <option value="">Tümü</option>
          <option value="BEKLEMEDE">Beklemede</option>
          <option value="ONAYLANDI">Onaylandı</option>
          <option value="REDDEDILDI">Reddedildi</option>
          <option value="SATINALMA_SURECINDE">Satınalma Sürecinde</option>
          <option value="TAMAMLANDI">Tamamlandı</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Öncelik
        </label>
        <select
          className="w-full px-3 py-2 border rounded-md"
          value={searchParams.get('oncelik') || ''}
          onChange={(e) => handleFilterChange('oncelik', e.target.value)}
        >
          <option value="">Tümü</option>
          <option value="YUKSEK">Yüksek</option>
          <option value="ORTA">Orta</option>
          <option value="DUSUK">Düşük</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sıralama
        </label>
        <select
          className="w-full px-3 py-2 border rounded-md"
          value={searchParams.get('siralamaAlani') || 'createdAt'}
          onChange={(e) => handleFilterChange('siralamaAlani', e.target.value)}
        >
          <option value="createdAt">Tarih</option>
          <option value="baslik">Başlık</option>
          <option value="oncelik">Öncelik</option>
        </select>
      </div>
    </div>
  );
} 