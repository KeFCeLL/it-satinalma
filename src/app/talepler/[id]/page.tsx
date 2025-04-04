import { Suspense } from 'react';
import { TalepDetay } from '@/components/talep-detay';

interface TalepDetayPageProps {
  params: {
    id: string;
  };
}

export default function TalepDetayPage({ params }: TalepDetayPageProps) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Talep Detayı</h1>
        <Suspense fallback={<div>Yükleniyor...</div>}>
          <TalepDetay talepId={params.id} />
        </Suspense>
      </div>
    </div>
  );
} 