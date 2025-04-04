import { Suspense } from 'react';
import { TalepForm } from '@/components/forms/talep-form';

export default function YeniTalepPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Yeni Talep Oluştur</h1>
      </div>

      <Suspense fallback={<div>Yükleniyor...</div>}>
        <TalepForm />
      </Suspense>
    </div>
  );
} 