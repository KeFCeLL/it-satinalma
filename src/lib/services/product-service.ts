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
  try {
    const url = addQueryParams('/api/urunler', params || {});
    const response = await fetchWithAuth(url);
    
    const data = await handleApiResponse<any>(response);
    
    // Güvenli bir API yanıtı hazırla
    return {
      data: Array.isArray(data.urunler) ? data.urunler : 
            Array.isArray(data.data) ? data.data : [],
      meta: {
        toplam: data.toplamUrunSayisi || data.meta?.toplam || 0,
        sayfaBasi: data.sayfaBasina || data.meta?.sayfaBasi || 10,
        mevcutSayfa: data.sayfa || data.meta?.mevcutSayfa || 1,
        sonSayfa: data.sonSayfa || data.meta?.sonSayfa || 1
      }
    };
  } catch (error) {
    console.error("Ürünler getirilirken hata:", error);
    // Hata durumunda bile uygulamanın çalışmaya devam etmesi için boş veri döndür
    return { 
      data: [], 
      meta: { toplam: 0, sayfaBasi: 10, mevcutSayfa: 1, sonSayfa: 1 } 
    };
  }
}

// Ürün kategorilerini getir
export async function getProductCategories(): Promise<{ kategoriler: string[] }> {
  try {
    const response = await fetchWithAuth('/api/urunler/kategoriler');
    const data = await handleApiResponse<any>(response);
    
    // Farklı API yanıt formatlarını destekle
    let kategoriler: string[] = [];
    
    if (Array.isArray(data)) {
      kategoriler = data;
    } else if (data && Array.isArray(data.data)) {
      kategoriler = data.data;
    } else if (data && Array.isArray(data.kategoriler)) {
      kategoriler = data.kategoriler;
    }
    
    return { kategoriler };
  } catch (error) {
    console.error("Kategoriler getirilirken hata:", error);
    // Hata durumunda boş dizi döndür
    return { kategoriler: [] };
  }
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