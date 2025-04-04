'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TalepKarti } from './talep-karti';
import { Pagination } from './pagination';

interface Talep {
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
}

export function TalepListesi() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [talepler, setTalepler] = useState<Talep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchTalepler = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams(searchParams.toString());
        params.set('sayfa', currentPage.toString());
        
        const response = await fetch(`/api/talepler?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Talepler yüklenirken bir hata oluştu');
        }
        
        const data = await response.json();
        setTalepler(data.data);
        setTotalPages(data.meta.totalPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchTalepler();
  }, [searchParams, currentPage]);

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (talepler.length === 0) {
    return <div className="text-gray-500">Henüz talep bulunmamaktadır.</div>;
  }

  return (
    <div>
      <div className="grid gap-4">
        {talepler.map((talep) => (
          <TalepKarti key={talep.id} talep={talep} />
        ))}
      </div>
      
      <div className="mt-6">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
} 