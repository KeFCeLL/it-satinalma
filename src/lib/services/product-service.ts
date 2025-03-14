import { fetchWithAuth, handleApiResponse, PaginatedResponse, PaginationParams, addQueryParams } from "../api";

export type Product = {
  id: string;
  ad: string;
  aciklama?: string;
  kategori: string;
  birimFiyat: number;
  birim: string;
  createdAt: string;
  updatedAt: string;
};

type ProductCreateInput = {
  ad: string;
  aciklama?: string;
  kategori: string;
  birimFiyat: number;
  birim?: string;
};

type ProductUpdateInput = {
  ad?: string;
  aciklama?: string;
  kategori?: string;
  birimFiyat?: number;
  birim?: string;
};

// Ürünleri getir
export async function getProducts(params?: PaginationParams & {
  kategori?: string;
  arama?: string;
}): Promise<PaginatedResponse<Product>> {
  const url = addQueryParams('/api/urunler', params || {});
  const response = await fetchWithAuth(url);
  return handleApiResponse(response);
}

// Ürün kategorilerini getir
export async function getProductCategories(): Promise<{ kategoriler: string[] }> {
  const response = await fetchWithAuth('/api/urunler/kategoriler');
  const data = await handleApiResponse<{ data: string[] }>(response);
  return { kategoriler: data.data || [] };
}

// Yeni kategori ekle
export async function addProductCategory(kategori: string): Promise<{ success: boolean; message: string; kategoriler: string[] }> {
  const response = await fetchWithAuth('/api/urunler/kategoriler', {
    method: 'POST',
    body: JSON.stringify({ kategori }),
  });
  const data = await handleApiResponse<{ success: boolean; message: string; data: string[] }>(response);
  return { 
    success: data.success, 
    message: data.message, 
    kategoriler: data.data || [] 
  };
}

// Kategori sil
export async function deleteProductCategory(kategori: string): Promise<{ success: boolean; message: string; kategoriler: string[] }> {
  const url = `/api/urunler/kategoriler?kategori=${encodeURIComponent(kategori)}`;
  const response = await fetchWithAuth(url, {
    method: 'DELETE',
  });
  const data = await handleApiResponse<{ success: boolean; message: string; data: string[] }>(response);
  return { 
    success: data.success, 
    message: data.message, 
    kategoriler: data.data || [] 
  };
}

// Tek bir ürünü getir
export async function getProduct(id: string): Promise<{ urun: Product }> {
  const response = await fetchWithAuth(`/api/urunler/${id}`);
  return handleApiResponse(response);
}

// Yeni ürün oluştur (sadece admin, IT_ADMIN ve SATINALMA_ADMIN için)
export async function createProduct(data: ProductCreateInput): Promise<{ urun: Product }> {
  const response = await fetchWithAuth('/api/urunler', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return handleApiResponse(response);
}

// Ürün güncelle (sadece admin, IT_ADMIN ve SATINALMA_ADMIN için)
export async function updateProduct(id: string, data: ProductUpdateInput): Promise<{ urun: Product }> {
  const response = await fetchWithAuth(`/api/urunler/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return handleApiResponse(response);
}

// Ürün sil (sadece admin, IT_ADMIN ve SATINALMA_ADMIN için)
export async function deleteProduct(id: string): Promise<{ success: boolean }> {
  const response = await fetchWithAuth(`/api/urunler/${id}`, {
    method: 'DELETE',
  });
  return handleApiResponse(response);
} 