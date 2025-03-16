// API yolları için konfigürasyon
const apiConfig = {
  // Normalde kullanılacak API yolları
  normal: {
    bildirimler: '/api/bildirimler',
    gorevler: '/api/gorevler',
    etkinlikler: '/api/etkinlikler'
  },
  
  // Mock veriler için alternatif API yolları
  mock: {
    bildirimler: '/api/bildirimler-mock',
    gorevler: '/api/gorevler-mock',
    etkinlikler: '/api/etkinlikler-mock'
  }
};

// Mock API'lerini kullanmak için fonksiyon
export function getApiPath(path) {
  // /api/ ile başlayan bir yol mu kontrol et
  if (!path.startsWith('/api/')) {
    return path;
  }
  
  // Mock kullanılacak mı kontrol et (client side için)
  let useMock = false;
  
  try {
    // Güvenli bir şekilde localStorage'a erişmeyi dene
    if (typeof window !== 'undefined' && window.localStorage) {
      useMock = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true' || 
                window.localStorage.getItem('useMockApi') === 'true';
    }
  } catch (e) {
    console.error('localStorage erişim hatası:', e);
  }

  // Eğer mock kullanılacaksa, desteklenen endpoint'ler için mock versiyonuna yönlendir
  if (useMock) {
    if (path === apiConfig.normal.bildirimler || path.startsWith(apiConfig.normal.bildirimler + '?')) {
      return path.replace(apiConfig.normal.bildirimler, apiConfig.mock.bildirimler);
    }
    if (path === apiConfig.normal.gorevler || path.startsWith(apiConfig.normal.gorevler + '?')) {
      return path.replace(apiConfig.normal.gorevler, apiConfig.mock.gorevler);
    }
    if (path === apiConfig.normal.etkinlikler || path.startsWith(apiConfig.normal.etkinlikler + '?')) {
      return path.replace(apiConfig.normal.etkinlikler, apiConfig.mock.etkinlikler);
    }
  }
  
  // Değişiklik yok, normal yolu kullan
  return path;
}

// Kullanıcı tarafında mock API'yi açıp kapatmak için
export function toggleMockApi(enable) {
  try {
    // Güvenli bir şekilde localStorage'a erişmeyi dene
    if (typeof window !== 'undefined' && window.localStorage) {
      if (enable) {
        window.localStorage.setItem('useMockApi', 'true');
        console.log('🔧 Mock API modu açıldı');
      } else {
        window.localStorage.removeItem('useMockApi');
        console.log('🔧 Mock API modu kapatıldı');
      }
    }
  } catch (e) {
    console.error('localStorage erişim hatası:', e);
  }
}

export default apiConfig;