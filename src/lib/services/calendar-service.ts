import { fetchWithAuth, handleApiResponse } from "../api";

export type Etkinlik = {
  id: string;
  baslik: string;
  baslangic: string | Date;
  bitis: string | Date;
  konum?: string;
  aciklama?: string;
  kullaniciId: string;
  createdAt: string;
  updatedAt: string;
};

export type EtkinlikInput = {
  baslik: string;
  baslangic: string | Date;
  bitis: string | Date;
  konum?: string;
  aciklama?: string;
};

// Kullanıcının etkinliklerini getir
export async function getEtkinlikler(params?: {
  baslangic?: string | Date;
  bitis?: string | Date;
}): Promise<{ data: Etkinlik[] }> {
  let url = '/api/etkinlikler';
  
  // Parametreleri ekle
  if (params) {
    const queryParams = new URLSearchParams();
    if (params.baslangic) {
      queryParams.append('baslangic', params.baslangic.toString());
    }
    if (params.bitis) {
      queryParams.append('bitis', params.bitis.toString());
    }
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
  }
  
  const response = await fetchWithAuth(url);
  return handleApiResponse(response);
}

// Yeni etkinlik oluştur
export async function createEtkinlik(etkinlik: EtkinlikInput): Promise<{ data: Etkinlik }> {
  const response = await fetchWithAuth('/api/etkinlikler', {
    method: 'POST',
    body: JSON.stringify(etkinlik),
  });
  return handleApiResponse(response);
} 