/**
 * API istekleri için yardımcı işlevler
 */

import { useAuth } from "./context/auth-context";

// API isteği yapmak için yardımcı işlev
export async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  // Client-side kontrolü
  if (typeof window === 'undefined') {
    console.warn('fetchWithAuth server-side çağrıldı, normal fetch kullanılıyor');
    return fetch(endpoint, options);
  }

  // Options içine credentials ekle
  const config: RequestInit = {
    ...options,
    credentials: "include", // Cookie'leri dahil et
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  try {
    // İstek yap
    let response = await fetch(endpoint, config);
    console.log(`API isteği: ${endpoint}, Durum: ${response.status}`);

    // Token hatası varsa ve refresh token mevcutsa, token'ı yenile ve tekrar dene
    if (response.status === 401) {
      console.log("401 hatası alındı, token yenileniyor...");
      
      try {
        // 401 hatası alındı, token yenilemeye çalış
        console.log("Token yenileme isteği yapılıyor");
        const refreshResponse = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        // Yanıt durumunu kontrol et
        console.log(`Token yenileme yanıtı: ${refreshResponse.status}`);
        
        // Yanıt içeriğini log'a yazdır
        let refreshBody;
        try {
          // Clone response çünkü response.text() body'yi tüketir
          const clonedResponse = refreshResponse.clone();
          refreshBody = await clonedResponse.text();
          console.log("Token yenileme yanıtı (raw):", refreshBody);
        } catch (e) {
          console.error("Token yenileme yanıtı okunamadı:", e);
        }

        // Token yenileme başarılı olduysa isteği tekrarla
        if (refreshResponse.ok) {
          console.log("Token yenileme başarılı, istek tekrarlanıyor...");
          
          // Orijinal isteği tekrarla
          try {
            const newResponse = await fetch(endpoint, config);
            console.log(`Tekrar edilen istek yanıtı: ${newResponse.status}`);
            return newResponse;
          } catch (retryError) {
            console.error("İsteği tekrarlama hatası:", retryError);
            return response; // Orijinal 401 yanıtını döndür
          }
        } else {
          console.error("Token yenileme başarısız:", refreshResponse.status, refreshBody);
          
          // Yenileme başarısız olduysa orijinal 401 yanıtını döndür
          return response;
        }
      } catch (refreshError) {
        console.error("Token yenileme işlemi sırasında hata:", refreshError);
        // Hata durumunda orijinal yanıtı döndür
        return response;
      }
    }

    return response;
  } catch (fetchError) {
    console.error(`Fetch hatası (${endpoint}):`, fetchError);
    throw fetchError;
  }
}

// API sonuçlarını işlemek için yardımcı işlev
export async function handleApiResponse<T>(response: Response): Promise<T> {
  let responseText = '';
  try {
    // Önce response içeriğini text olarak alıp saklayalım
    responseText = await response.text();
    
    // Boş yanıt kontrolü
    if (!responseText || responseText.trim() === '') {
      console.error("API boş yanıt döndürdü:", response.status, response.statusText);
      throw new Error(`Sunucu boş yanıt döndürdü. Durum: ${response.status} ${response.statusText}`);
    }
    
    try {
      // Text'i JSON'a çevirelim
      const data = JSON.parse(responseText);
      
      if (!response.ok) {
        // API hata mesajını kullan veya varsayılan mesaj döndür
        const error = data.message || "Bir şeyler yanlış gitti";
        console.error("API hata yanıtı:", error, data);
        throw new Error(error);
      }
      
      return data as T;
    } catch (jsonError) {
      // JSON ayrıştırma hatası
      console.error("Ham API yanıtı ayrıştırılamadı:", responseText);
      console.error("JSON ayrıştırma hatası:", jsonError);
      throw new Error(`API yanıtı geçerli JSON formatında değil: ${(jsonError as Error).message}`);
    }
  } catch (error) {
    // Text alınırken veya JSON ayrıştırılırken hata oluştu
    if (error instanceof Error) {
      console.error("Ham API yanıtı:", JSON.stringify(responseText));
      throw error;
    }
    
    // Bilinmeyen hata durumu
    console.error("Beklenmeyen API yanıt hatası:", error);
    throw new Error("API yanıtı işlenirken beklenmeyen bir hata oluştu");
  }
}

// Sayfalandırma için tip tanımlaması
export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    toplam: number;
    sayfaBasi: number;
    mevcutSayfa: number;
    sonSayfa: number;
  };
};

// API'ye gönderilecek sayfalandırma parametreleri
export type PaginationParams = {
  sayfa?: number;
  sayfaBasi?: number;
  siralamaAlani?: string;
  siralamaYonu?: "asc" | "desc";
};

// URL'e sorgu parametreleri eklemek için yardımcı işlev
export function addQueryParams(url: string, params: Record<string, any>): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const urlObj = new URL(url, origin);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      urlObj.searchParams.append(key, String(value));
    }
  });
  
  return urlObj.toString();
}

// İstek hata işleyici
export const handleRequestError = (error: any) => {
  console.error("API isteği hatası:", error);
  if (error instanceof Response && error.status === 401) {
    // Kimlik doğrulama hatası, kullanıcıyı giriş sayfasına yönlendir
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return "Oturum süresi doldu, lütfen tekrar giriş yapın.";
  }
  return error.message || "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
}; 