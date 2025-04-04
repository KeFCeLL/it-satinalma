'use client';

import { useRouter } from 'next/navigation';

export function TalepOlusturButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push('/talepler/yeni')}
      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
    >
      Yeni Talep Oluştur
    </button>
  );
} 