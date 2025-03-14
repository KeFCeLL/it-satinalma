import { fetchWithAuth, handleApiResponse } from "../api";

export type Gorev = {
  id: string;
  metin: string;
  tamamlandi: boolean;
  kullaniciId: string;
  sonTarih?: string | Date;
  createdAt: string;
  updatedAt: string;
};

export type GorevInput = {
  metin: string;
  tamamlandi?: boolean;
  sonTarih?: string | Date;
};

export type GorevUpdateInput = {
  id: string;
  metin?: string;
  tamamlandi?: boolean;
  sonTarih?: string | Date;
};

// Kullanıcının görevlerini getir
export async function getGorevler(params?: {
  tamamlandi?: boolean;
}): Promise<{ data: Gorev[] }> {
  let url = '/api/gorevler';
  
  // Parametreleri ekle
  if (params && params.tamamlandi !== undefined) {
    url += `?tamamlandi=${params.tamamlandi}`;
  }
  
  const response = await fetchWithAuth(url);
  return handleApiResponse(response);
}

// Yeni görev oluştur
export async function createGorev(gorev: GorevInput): Promise<{ data: Gorev }> {
  const response = await fetchWithAuth('/api/gorevler', {
    method: 'POST',
    body: JSON.stringify(gorev),
  });
  return handleApiResponse(response);
}

// Görev güncelle
export async function updateGorev(gorev: GorevUpdateInput): Promise<{ data: Gorev }> {
  const response = await fetchWithAuth('/api/gorevler', {
    method: 'PUT',
    body: JSON.stringify(gorev),
  });
  return handleApiResponse(response);
}

// Görev sil
export async function deleteGorev(id: string): Promise<{ success: boolean; message: string }> {
  const response = await fetchWithAuth(`/api/gorevler/${id}`, {
    method: 'DELETE',
  });
  return handleApiResponse(response);
} 