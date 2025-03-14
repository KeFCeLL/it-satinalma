import { fetchWithAuth, handleApiResponse, PaginatedResponse, PaginationParams, addQueryParams } from "../api";

export type Department = {
  id: string;
  ad: string;
  aciklama?: string;
  createdAt: string;
  updatedAt: string;
};

type DepartmentCreateInput = {
  ad: string;
  aciklama?: string;
};

type DepartmentUpdateInput = {
  ad?: string;
  aciklama?: string;
};

// Tüm departmanları getir
export async function getDepartments(params?: PaginationParams & {
  arama?: string;
}): Promise<PaginatedResponse<Department>> {
  const url = addQueryParams('/api/departmanlar', params || {});
  const response = await fetchWithAuth(url);
  return handleApiResponse(response);
}

// Tüm departmanları seçenek olarak getir (pagination olmadan)
export async function getDepartmentOptions(): Promise<{ departmanlar: Department[] }> {
  const response = await fetchWithAuth('/api/departmanlar?hepsi=true');
  return handleApiResponse(response);
}

// Tek bir departmanı getir
export async function getDepartment(id: string): Promise<{ departman: Department }> {
  const response = await fetchWithAuth(`/api/departmanlar/${id}`);
  return handleApiResponse(response);
}

// Yeni departman oluştur (sadece admin için)
export async function createDepartment(data: DepartmentCreateInput): Promise<{ departman: Department }> {
  const response = await fetchWithAuth('/api/departmanlar', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return handleApiResponse(response);
}

// Departman güncelle (sadece admin için)
export async function updateDepartment(id: string, data: DepartmentUpdateInput): Promise<{ departman: Department }> {
  const response = await fetchWithAuth(`/api/departmanlar/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return handleApiResponse(response);
}

// Departman sil (sadece admin için)
export async function deleteDepartment(id: string): Promise<{ success: boolean }> {
  const response = await fetchWithAuth(`/api/departmanlar/${id}`, {
    method: 'DELETE',
  });
  return handleApiResponse(response);
} 