/**
 * API istekleri için yardımcı işlevler
 */

import { useAuth } from "./context/auth-context";
import { getApiPath } from './api-config';

// API kullanım modu
type ApiMode = 'normal' | 'mock';

// Geçerli API modunu belirle
function getCurrentApiMode(): ApiMode {
  // Server-side rendering sırasında
  if (typeof window === 'undefined') {
    // Vercel production'da her zaman normal mod kullan
    if (process.env.VERCEL_ENV === 'production') {
      return 'normal';
    }
    return 'mock'; // Vercel build ve SSR sırasında mock mod kullan
  }
  
  // Client tarafında
  try {
    // Öncelik sırası:
    // 1. localStorage
    // 2. çevre değişkenleri
    // 3. Varsayılan: normal (production'da)
    
    // localStorage kontrolü
    const storedMode = window.localStorage.getItem('useMockApi');
    if (storedMode === 'false') return 'normal';
    if (storedMode === 'true') return 'mock';
    
    // Çevre değişkeni kontrolü
    if (process.env.NEXT_PUBLIC_USE_MOCK_API === 'false') return 'normal';
    if (process.env.NEXT_PUBLIC_USE_MOCK_API === 'true') return 'mock';
    
    // Varsayılan olarak normal kullan çünkü production'da gerçek API'ye erişim gerekir
    return 'normal';
  } catch (e) {
    console.error('API modu belirleme hatası:', e);
    return 'normal'; // Hata durumunda güvenli mod
  }
}

// API isteği yapmak için yardımcı işlev
export async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  // API modunu belirle
  const apiMode = getCurrentApiMode();
  console.log(`🔌 API Modu: ${apiMode}`);
  
  // Mock API desteği için endpoint'i dönüştür
  const transformedEndpoint = apiMode === 'mock' ? getApiPath(endpoint) : endpoint;
  
  // Check if we're on the server side
  const isServer = typeof window === 'undefined';
  
  let url = transformedEndpoint;
  
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
        console.error("Token yenileme sırasında hata:", refreshError);
        return response; // Orijinal 401 yanıtını döndür
      }
    }

    return response;
  } catch (error) {
    console.error("API isteği hatası:", error);
    throw error;
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
      
      // Boş yanıt durumunda varsayılan bir yanıt oluştur
      return {
        success: false,
        message: `Sunucu boş yanıt döndürdü. Durum: ${response.status} ${response.statusText}`,
        data: []
      } as unknown as T;
    }
    
    try {
      // Text'i JSON'a çevirelim
      const data = JSON.parse(responseText);
      
      if (!response.ok) {
        // API hata mesajını kullan veya varsayılan mesaj döndür
        const error = data.message || "Bir şeyler yanlış gitti";
        console.error("API hata yanıtı:", error, data);
        
        // Hata durumunda bile veri dönmesini sağla (crash'i engelle)
        return {
          success: false,
          message: error,
          data: []
        } as unknown as T;
      }
      
      return data as T;
    } catch (jsonError) {
      // JSON ayrıştırma hatası
      console.error("Ham API yanıtı ayrıştırılamadı:", responseText);
      console.error("JSON ayrıştırma hatası:", jsonError);
      
      // JSON hatası durumunda da varsayılan bir yanıt oluştur
      return {
        success: false,
        message: `API yanıtı geçerli JSON formatında değil: ${(jsonError as Error).message}`,
        data: []
      } as unknown as T;
    }
  } catch (error) {
    // Text alınırken veya JSON ayrıştırılırken hata oluştu
    console.error("Ham API yanıtı işlenirken hata:", error);
    
    // Hata durumunda da veri dönmesini sağla (crash'i engelle)
    return {
      success: false,
      message: error instanceof Error ? error.message : "API yanıtı işlenirken beklenmeyen bir hata oluştu",
      data: []
    } as unknown as T;
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

// API istek hatalarını işlemek için yardımcı fonksiyon
export const handleRequestError = (error: any) => {
  if (error instanceof Error) {
    return {
      success: false,
      message: error.message
    };
  }
  
  return {
    success: false,
    message: "Beklenmeyen bir hata oluştu"
  };
}; 