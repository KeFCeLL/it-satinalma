// API yolları için konfigürasyon
const apiConfig = {
  // Normalde kullanılacak API yolları
  normal: {
    bildirimler: '/api/bildirimler',
    gorevler: '/api/gorevler',
    etkinlikler: '/api/etkinlikler',
    departmanlar: '/api/departmanlar',
    kullanicilar: '/api/kullanicilar',
    urunler: '/api/urunler',
    talepler: '/api/talepler',
    roller: '/api/roller'
  },
  
  // Mock veriler için alternatif API yolları
  mock: {
    bildirimler: '/api/bildirimler-mock',
    gorevler: '/api/gorevler-mock',
    etkinlikler: '/api/etkinlikler-mock',
    departmanlar: '/api/departmanlar-mock',
    kullanicilar: '/api/kullanicilar-mock',
    urunler: '/api/urunler-mock',
    talepler: '/api/talepler-mock',
    roller: '/api/roller-mock'
  },
  
  // Varsayılan Fetch seçenekleri
  defaultFetchOptions: {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    credentials: 'include',
    cache: 'no-store'
  },
  
  // GET istekleri için varsayılan fetch ayarları
  getRequestOptions() {
    return {
      method: 'GET',
      ...this.defaultFetchOptions,
    };
  },
  
  // POST istekleri için varsayılan fetch ayarları
  postRequestOptions(data) {
    return {
      method: 'POST',
      ...this.defaultFetchOptions,
      body: JSON.stringify(data)
    };
  },
  
  // PUT istekleri için varsayılan fetch ayarları
  putRequestOptions(data) {
    return {
      method: 'PUT',
      ...this.defaultFetchOptions,
      body: JSON.stringify(data)
    };
  },
  
  // DELETE istekleri için varsayılan fetch ayarları
  deleteRequestOptions() {
    return {
      method: 'DELETE',
      ...this.defaultFetchOptions
    };
  }
};

// Mock API'lerini kullanmak için fonksiyon
export function getApiPath(path) {
  // /api/ ile başlayan bir yol mu kontrol et
  if (!path.startsWith('/api/')) {
    return path;
  }
  
  // Mock kullanılacak mı kontrol et (client side için)
  let useMock = true; // Varsayılan olarak mock modu aktif
  
  try {
    // Güvenli bir şekilde localStorage'a erişmeyi dene
    if (typeof window !== 'undefined' && window.localStorage) {
      // localStorage 'false' değeri içeriyorsa mock modunu kapat
      if (window.localStorage.getItem('useMockApi') === 'false') {
        useMock = false;
      }
    }
  } catch (e) {
    console.error('localStorage erişim hatası:', e);
  }

  // Mock modu kapalıysa orijinal endpoint'i kullan
  if (!useMock) {
    return path;
  }
  
  // Mock endpoint'leri eşleştir
  const apiPairs = [
    { normal: apiConfig.normal.bildirimler, mock: apiConfig.mock.bildirimler },
    { normal: apiConfig.normal.gorevler, mock: apiConfig.mock.gorevler },
    { normal: apiConfig.normal.etkinlikler, mock: apiConfig.mock.etkinlikler },
    { normal: apiConfig.normal.departmanlar, mock: apiConfig.mock.departmanlar },
    { normal: apiConfig.normal.kullanicilar, mock: apiConfig.mock.kullanicilar },
    { normal: apiConfig.normal.urunler, mock: apiConfig.mock.urunler },
    { normal: apiConfig.normal.talepler, mock: apiConfig.mock.talepler },
    { normal: apiConfig.normal.roller, mock: apiConfig.mock.roller }
  ];
  
  // Endpoint'leri eşleştir ve yönlendir
  for (const pair of apiPairs) {
    if (path === pair.normal || path.startsWith(pair.normal + '?') || path.startsWith(pair.normal + '/')) {
      return path.replace(pair.normal, pair.mock);
    }
  }
  
  // Eşleşme bulunamadı, orijinal yolu kullan
  console.log(`⚠️ Mock endpoint bulunamadı: ${path}`);
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
        window.localStorage.setItem('useMockApi', 'false');
        console.log('🔧 Mock API modu kapatıldı');
      }
      // Sayfayı yenile
      window.location.reload();
    }
  } catch (e) {
    console.error('localStorage erişim hatası:', e);
  }
}

// API isteği yapmak için yardımcı fonksiyon
export async function fetchWithoutCache(url, options = {}) {
  // ZORUNLU: Her istek için useMockApi=false ayarla, dev modunu kesinlikle devre dışı bırak
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('useMockApi', 'false');
  }

  // Varsayılan önbellekleme önleyici başlıkları ekle
  const headers = {
    ...options.headers,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Force-No-Mock': 'true', // Özel başlık: mock veri kullanımını engelle
    'X-Request-Time': Date.now().toString() // Her istekte benzersiz değer
  };
  
  // Yeni URL nesnesi oluştur ve önbellek parametresi ekle
  const urlObj = new URL(url, window.location.origin);
  
  // Önbellek atlama parametreleri
  urlObj.searchParams.append('_nocache', Date.now().toString());
  urlObj.searchParams.append('_force', 'true');
  
  // Güncellenmiş seçenekler
  const updatedOptions = {
    ...options,
    headers,
    cache: 'no-store',
    next: { revalidate: 0 }
  };
  
  console.log(`📤 API İsteği (no-cache): ${urlObj.toString()}`);
  
  // İstek ve yanıt işleme sürelerini kaydet
  const startTime = Date.now();
  
  try {
    // Fetch isteği yap
    const response = await fetch(urlObj.toString(), updatedOptions);
    const endTime = Date.now();
    console.log(`📥 API Yanıtı: ${response.status} ${response.statusText} (${endTime - startTime}ms)`);
    
    return response;
  } catch (error) {
    console.error(`🚨 API Hatası: ${error.message}`);
    throw error;
  }
}

export default apiConfig;