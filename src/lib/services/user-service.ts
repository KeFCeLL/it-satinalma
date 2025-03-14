import { fetchWithAuth, handleApiResponse, PaginatedResponse, PaginationParams, addQueryParams } from "../api";

export type UserStatus = 'AKTIF' | 'PASIF';

export type User = {
  id: string;
  email: string;
  ad: string;
  soyad: string;
  rol: string;
  departmanId?: string;
  departman?: {
    id: string;
    ad: string;
  };
  sonGirisTarihi?: string;
  durum?: UserStatus;
};

export type UserCreateInput = {
  email: string;
  sifre: string;
  ad: string;
  soyad: string;
  rol: string;
  departmanId?: string;
  durum?: UserStatus;
};

export type UserUpdateInput = {
  email?: string;
  sifre?: string;
  ad?: string;
  soyad?: string;
  rol?: string;
  departmanId?: string;
  durum?: UserStatus;
};

// Kullanıcı listesini getir (sadece admin ve departman yöneticileri için)
export async function getUsers(options?: {
  rol?: string;
  departmanId?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<PaginatedResponse<User>> {
  let url = `/api/kullanicilar`;
  const params = new URLSearchParams();

  if (options) {
    // Filter by role
    if (options.rol) {
      params.append('rol', options.rol);
    }

    // Filter by department
    if (options.departmanId) {
      params.append('departmanId', options.departmanId);
    }

    // Pagination
    if (options.page !== undefined) {
      params.append('page', options.page.toString());
    }

    if (options.pageSize !== undefined) {
      params.append('pageSize', options.pageSize.toString());
    }

    // Search
    if (options.search) {
      params.append('search', options.search);
    }
  }

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const response = await fetchWithAuth(url);
  return handleApiResponse(response);
}

// Tek bir kullanıcıyı getir
export async function getUser(id: string): Promise<{ user: User }> {
  const response = await fetchWithAuth(`/api/kullanicilar/${id}`);
  return handleApiResponse(response);
}

// Yeni kullanıcı oluştur (sadece admin için)
export async function createUser(user: UserCreateInput): Promise<{ user: User }> {
  const response = await fetchWithAuth('/api/kullanicilar', {
    method: 'POST',
    body: JSON.stringify(user),
  });
  return handleApiResponse(response);
}

// Kullanıcı güncelle
export async function updateUser(id: string, user: UserUpdateInput): Promise<{ user: User }> {
  const response = await fetchWithAuth(`/api/kullanicilar/${id}`, {
    method: 'PUT',
    body: JSON.stringify(user),
  });
  return handleApiResponse(response);
}

// Kullanıcı sil (sadece admin için)
export async function deleteUser(id: string): Promise<{ success: boolean }> {
  const response = await fetchWithAuth(`/api/kullanicilar/${id}`, {
    method: 'DELETE',
  });
  return handleApiResponse(response);
}

export async function updateUserStatus(id: string, durum: UserStatus): Promise<{ success: boolean }> {
  const response = await fetchWithAuth(`/api/kullanicilar/${id}/durum`, {
    method: 'PUT',
    body: JSON.stringify({ durum }),
  });
  return handleApiResponse(response);
}

export async function resetUserPassword(id: string): Promise<{ success: boolean }> {
  const response = await fetchWithAuth(`/api/kullanicilar/${id}/reset-password`, {
    method: 'POST',
  });
  return handleApiResponse(response);
} 