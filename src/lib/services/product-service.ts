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
  try {
    console.log(`Kategori ekleme isteği yapılıyor: ${kategori}`);
    
    // Önce normal POST isteğini deneyelim
    try {
      const response = await fetchWithAuth('/api/urunler/kategoriler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ kategori }),
      });
      
      console.log(`Kategori ekleme yanıtı (HTTP status): ${response.status}`);
      
      // 405 Method Not Allowed hatası durumunda alternatif yönteme geç
      if (response.status === 405) {
        throw new Error('405 Method Not Allowed');
      }
      
      const data = await handleApiResponse<any>(response);
      
      // Yanıt yapısını kontrol et
      let kategoriler: string[] = [];
      if (Array.isArray(data.data)) {
        kategoriler = data.data;
      } else if (data && Array.isArray(data.kategoriler)) {
        kategoriler = data.kategoriler;
      } else if (Array.isArray(data)) {
        kategoriler = data;
      }
      
      return { 
        success: data.success || false, 
        message: data.message || 'Kategori işlemi tamamlandı', 
        kategoriler: kategoriler 
      };
    } catch (error) {
      // POST isteği başarısız oldu, alternatif yöntemi dene
      console.log('POST isteği başarısız oldu, alternatif yöntemi deniyorum...');
      
      // Alternatif GET endpoint'ini kullan
      const alternativeResponse = await fetchWithAuth(
        `/api/urunler/kategoriler/add?name=${encodeURIComponent(kategori)}`,
        { method: 'GET' }
      );
      
      console.log(`Alternatif istek yanıtı (HTTP status): ${alternativeResponse.status}`);
      
      if (!alternativeResponse.ok) {
        throw new Error(`Alternatif istek başarısız: ${alternativeResponse.status}`);
      }
      
      const altData = await handleApiResponse<any>(alternativeResponse);
      
      // Yanıt yapısını kontrol et
      let kategoriler: string[] = [];
      if (Array.isArray(altData.data)) {
        kategoriler = altData.data;
      } else if (altData && Array.isArray(altData.kategoriler)) {
        kategoriler = altData.kategoriler;
      } else if (Array.isArray(altData)) {
        kategoriler = altData;
      }
      
      return { 
        success: altData.success || false, 
        message: (altData.message || 'Kategori başarıyla eklendi') + ' (alternatif yöntem)', 
        kategoriler: kategoriler 
      };
    }
  } catch (error) {
    console.error("Kategori eklenirken hata:", error);
    return {
      success: false,
      message: error instanceof Error 
        ? error.message 
        : 'Kategori eklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
      kategoriler: []
    };
  }
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