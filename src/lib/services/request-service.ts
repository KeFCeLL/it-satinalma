import { fetchWithAuth, handleApiResponse, PaginatedResponse, PaginationParams, addQueryParams } from "../api";
import { Product } from "./product-service";
import { User } from "./user-service";
import { Department } from "./department-service";

export type RequestStatus = 
  | "TASLAK" 
  | "BEKLEMEDE" 
  | "ONAYLANDI" 
  | "REDDEDILDI" 
  | "TAMAMLANDI" 
  | "IPTAL_EDILDI";

export type RequestPriority = 
  | "DUSUK" 
  | "ORTA" 
  | "YUKSEK" 
  | "KRITIK";

export type ApprovalStep = 
  | "DEPARTMAN_YONETICISI" 
  | "IT_DEPARTMANI" 
  | "FINANS_DEPARTMANI" 
  | "SATINALMA_DEPARTMANI";

export type RequestApproval = {
  id: string;
  talepId: string;
  adim: ApprovalStep;
  durum: "BEKLEMEDE" | "ONAYLANDI" | "REDDEDILDI" | "BEKLEMIYOR" | "SATINALMA_SURECINDE" | "TAMAMLANDI";
  onaylayanId: string | null;
  onaylayan?: User;
  aciklama: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RequestNote = {
  id: string;
  talepId: string;
  userId: string;
  user: User;
  icerik: string;
  createdAt: string;
};

export type UrunTalep = {
  id: string;
  talepId: string;
  urunId: string;
  urun?: Product;
  miktar: number;
  tutar: number;
  createdAt: string;
  updatedAt: string;
};

export type Request = {
  id: string;
  baslik: string;
  aciklama: string;
  talepEdenId: string;
  talepEden?: User;
  departmanId: string;
  departman?: Department;
  durum: RequestStatus;
  oncelik: RequestPriority;
  urunId: string;
  urun?: Product;
  miktar: number;
  onayAdimi: ApprovalStep;
  onaylar?: RequestApproval[];
  notlar?: RequestNote[];
  urunTalepler?: UrunTalep[];
  createdAt: string;
  updatedAt: string;
};

type RequestCreateInput = {
  baslik: string;
  aciklama: string;
  departmanId: string;
  oncelik: RequestPriority;
  urunId: string;
  miktar: number;
};

type RequestUpdateInput = {
  baslik?: string;
  aciklama?: string;
  oncelik?: RequestPriority;
  urunId?: string;
  miktar?: number;
};

type RequestApprovalInput = {
  adim: ApprovalStep;
  durum: "ONAYLANDI" | "REDDEDILDI" | "SATINALMA_SURECINDE" | "TAMAMLANDI";
  aciklama?: string;
};

// Talepleri getir
export async function getRequests(params?: PaginationParams & {
  durum?: RequestStatus;
  departmanId?: string;
  oncelik?: RequestPriority;
  baslangicTarihi?: string;
  bitisTarihi?: string;
  arama?: string;
}): Promise<PaginatedResponse<Request>> {
  const url = addQueryParams('/api/talepler', params || {});
  const response = await fetchWithAuth(url);
  return handleApiResponse(response);
}

// Tek bir talebi getir
export async function getRequest(id: string): Promise<{ talep: Request }> {
  const response = await fetchWithAuth(`/api/talepler/${id}`);
  const apiResponse = await handleApiResponse<{ success: boolean; data: Request }>(response);
  
  // API yanıtını dönüştür
  return { talep: apiResponse.data };
}

// Yeni talep oluştur
export async function createRequest(data: RequestCreateInput): Promise<{ talep: Request }> {
  const response = await fetchWithAuth('/api/talepler', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return handleApiResponse(response);
}

// Talep güncelle (sadece sahibi veya admin)
export async function updateRequest(id: string, data: RequestUpdateInput): Promise<{ talep: Request }> {
  const response = await fetchWithAuth(`/api/talepler/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return handleApiResponse(response);
}

// Talep iptal et (sadece sahibi veya admin)
export async function cancelRequest(id: string): Promise<{ success: boolean }> {
  const response = await fetchWithAuth(`/api/talepler/${id}`, {
    method: 'DELETE',
  });
  return handleApiResponse(response);
}

// Talep onayla/reddet
export async function updateRequestApproval(id: string, data: RequestApprovalInput): Promise<{ talep: Request }> {
  const response = await fetchWithAuth(`/api/talepler/${id}/onay`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return handleApiResponse(response);
}

// Talep notlarını getir
export async function getRequestNotes(id: string): Promise<{ notlar: RequestNote[] }> {
  const response = await fetchWithAuth(`/api/talepler/${id}/notlar`);
  return handleApiResponse(response);
}

// Talebe not ekle
export async function addRequestNote(id: string, icerik: string): Promise<{ not: RequestNote }> {
  const response = await fetchWithAuth(`/api/talepler/${id}/notlar`, {
    method: 'POST',
    body: JSON.stringify({ icerik }),
  });
  return handleApiResponse(response);
} 