/**
 * API istekleri için yardımcı işlevler
 */

import { useAuth } from "./context/auth-context";

// API isteği yapmak için yardımcı işlev
export async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  // Check if we're on the server side
  const isServer = typeof window === 'undefined';
  
  let url = endpoint;
  
  // For server-side requests during build or when no API is available
  if (isServer) {
    // Detect if we're in a build/CI environment
    const isBuildEnv = process.env.VERCEL_ENV === 'production' || 
                        process.env.NODE_ENV === 'production' ||
                        process.env.CI === 'true';
    
    if (isBuildEnv && endpoint.startsWith('/api/')) {
      console.warn(`[Build Mode] Mocking API request to: ${endpoint}`);
      
      // Return empty mock responses based on endpoint type
      if (endpoint.includes('departmanlar')) {
        return new Response(JSON.stringify({ departmanlar: [] }), {
          headers: { 'content-type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ data: [] }), {
        headers: { 'content-type': 'application/json' },
      });
    }
    
    // Regular server-side request (not during build)
    if (endpoint.startsWith('/')) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      url = `${baseUrl}${endpoint}`;
    }
    
    console.warn('fetchWithAuth server-side çağrıldı, URL:', url);
    return fetch(url, options);
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
    let response = await fetch(url, config);
    console.log(`API isteği: ${url}, Durum: ${response.status}`);

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
            const newResponse = await fetch(url, config);
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
    console.error(`Fetch hatası (${url}):`, fetchError);
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
  // Ensure clean params object
  const cleanParams: Record<string, string> = {};
  
  // Add only valid params
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      cleanParams[key] = String(value);
    }
  });
  
  // If no params to add, return original URL
  if (Object.keys(cleanParams).length === 0) {
    return url;
  }
  
  // Add query parameters manually to avoid URL object issues
  const hasQueryString = url.includes('?');
  let result = url;
  
  Object.entries(cleanParams).forEach(([key, value], index) => {
    if (index === 0 && !hasQueryString) {
      result += `?${key}=${encodeURIComponent(value)}`;
    } else {
      result += `&${key}=${encodeURIComponent(value)}`;
    }
  });
  
  return result;
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