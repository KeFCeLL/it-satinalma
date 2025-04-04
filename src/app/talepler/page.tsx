'use client';

import { useState } from 'react';
import { TalepDetayDialog } from '@/components/talep-detay-dialog';
import { Eye, Trash2 } from 'lucide-react';

export default function TaleplerPage() {
  const [selectedTalepId, setSelectedTalepId] = useState<string | null>(null);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Talepler</h1>
        <button className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800">
          Yeni Talep Oluştur
        </button>
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
              <tr className="border-b">
                <td className="py-3 px-4">T-d05a100d</td>
                <td className="py-3 px-4">Bilgisayar Talebi</td>
                <td className="py-3 px-4">Yazılım Geliştirme</td>
                <td className="py-3 px-4">Admin Kullanıcı</td>
                <td className="py-3 px-4">03.04.2025</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Onaylandı
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    Yüksek
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedTalepId('d05a100d-0b20-457f-a3fa-09a7e1f0fce1')}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
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