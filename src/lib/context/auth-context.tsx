"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth, handleApiResponse } from "@/lib/api";

export type User = {
  id: string;
  email: string;
  ad: string;
  soyad: string;
  rol: string;
  departmanId: string | null;
  departman?: {
    id: string;
    ad: string;
  };
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    // Eğer sayfa login sayfasıysa, bilgi almaya gerek yok
    if (typeof window !== 'undefined' && window.location.pathname === '/login') {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let userDataFetched = false;
    let refreshAttempted = false;

    try {
      console.log("Kullanıcı verileri yükleniyor...");
      
      // Önce normal yoldan kullanıcı verilerini almayı dene
      const userData = await fetchUserData();
      
      if (userData) {
        console.log("Kullanıcı verileri başarıyla alındı");
        setUser(userData);
        userDataFetched = true;
      } else {
        // Kullanıcı verileri alınamadıysa, token yenilemeyi dene
        console.log("Kullanıcı verileri alınamadı, token yenileniyor...");
        refreshAttempted = true;
        const refreshSuccess = await refreshSession();
        
        if (!refreshSuccess) {
          // Token yenileme de başarısız olduysa, kullanıcıyı login sayfasına yönlendir
          console.error("Token yenileme başarısız oldu");
          
          // Login sayfasında değilsek yönlendir
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            console.log("Kullanıcı login sayfasına yönlendiriliyor");
            setUser(null);
            
            // Login sayfasına yönlendir
            router.push("/login?session_expired=true");
          }
        } else {
          userDataFetched = true;
        }
      }
    } catch (error) {
      console.error("Kullanıcı bilgileri yüklenirken beklenmeyen hata:", error);
      
      // Hata durumunda token yenilemeyi dene (eğer daha önce denenmemişse)
      if (!refreshAttempted) {
        console.log("Hata nedeniyle token yenileme deneniyor...");
        refreshAttempted = true;
        const refreshSuccess = await refreshSession();
        
        if (!refreshSuccess) {
          // Yenileme başarısız olduysa ve login sayfasında değilsek, yönlendir
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            console.log("Token yenileme başarısız oldu, kullanıcı login sayfasına yönlendiriliyor");
            setUser(null);
            
            // Login sayfasına yönlendir
            router.push("/login?session_expired=true");
          }
        } else {
          userDataFetched = true;
        }
      }
    } finally {
      setIsLoading(false);
      
      // Eğer kullanıcı verileri alınamadıysa ve login sayfasında değilsek
      if (!userDataFetched && typeof window !== 'undefined' && window.location.pathname !== '/login') {
        console.log("Oturum durumu belirlenmedi, güvenli bir şekilde login sayfasına yönlendiriliyor");
        router.push("/login?session_expired=true");
      }
    }
  };

  const fetchUserData = async (): Promise<User | null> => {
    try {
      console.log("Kullanıcı bilgileri getiriliyor...");
      const response = await fetchWithAuth("/api/auth/me");
      
      // Yanıt başarılı değilse detaylı log ve null dön
      if (!response.ok) {
        console.error("Kullanıcı bilgileri alınamadı:", {
          status: response.status,
          statusText: response.statusText,
          body: await response.text().catch(e => "Response body alınamadı")
        });
        return null;
      }
      
      // Yanıt başarılıysa parse etmeyi dene
      try {
        const data = await handleApiResponse(response) as { success: boolean; user: User };
        
        if (data.success && data.user) {
          console.log("Kullanıcı bilgileri başarıyla alındı:", data.user.email);
          return data.user;
        }
        
        console.error("API yanıtı kullanıcı bilgisi içermiyor:", data);
        return null;
      } catch (error) {
        console.error("API yanıtı parse edilemedi:", error);
        return null;
      }
    } catch (error) {
      console.error("Kullanıcı bilgileri alınırken hata:", error);
      return null;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log("Login isteği yapılıyor:", email);
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      // Response doğru formatta mı kontrol et
      let data;
      try {
        data = await response.json() as { 
          success?: boolean; 
          user?: User; 
          error?: string 
        };
      } catch (error) {
        console.error("Login yanıtı parse edilemedi:", error);
        return { 
          success: false, 
          error: "Sunucu yanıtı geçersiz format içeriyor. Sunucu hatası olabilir." 
        };
      }
      
      console.log("Login yanıtı:", data);

      if (!response.ok) {
        console.error("Login hatası:", data?.error);
        return { 
          success: false, 
          error: data?.error || "Giriş yapılırken bir hata oluştu" 
        };
      }

      if (data.success && data.user) {
        setUser(data.user);
        return { success: true };
      } else {
        return { 
          success: false, 
          error: data.error || "Beklenmeyen yanıt formatı" 
        };
      }
    } catch (error) {
      console.error("Login işlemi sırasında hata:", error);
      return { 
        success: false, 
        error: "Sunucu ile iletişim sırasında bir hata oluştu" 
      };
    }
  };

  const refreshSession = async (): Promise<boolean> => {
    try {
      console.log("Oturum yenileniyor...");
      
      // Tarayıcı ortamını kontrol et
      if (typeof window === 'undefined') {
        console.error("Oturum yenileme başarısız: Tarayıcı ortamı bulunamadı");
        return false;
      }

      // Fetch isteği dene
      let response;
      try {
        response = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Cookie'leri dahil et
        });
      } catch (networkError) {
        console.error("Oturum yenileme ağ hatası:", networkError);
        return false;
      }

      // Yanıt içeriğini al
      let responseText;
      try {
        responseText = await response.text();
        console.log("Refresh yanıtı (raw):", responseText);
      } catch (textError) {
        console.error("Yanıt metni alınamadı:", textError);
        return false;
      }

      // JSON olarak parse et
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
        console.log("Refresh yanıtı (parsed):", data);
      } catch (parseError) {
        console.error("Refresh yanıtı JSON olarak parse edilemedi:", parseError);
        console.error("Raw response:", responseText);
        return false;
      }

      if (!response.ok) {
        console.error("Oturum yenileme hatası:", {
          status: response.status,
          statusText: response.statusText,
          error: data?.error || "Bilinmeyen hata",
          data: data
        });
        return false;
      }

      if (data.success && data.user) {
        console.log("Oturum başarıyla yenilendi:", data.user.email);
        setUser(data.user);
        return true;
      }

      console.error("Oturum yenileme yanıtı geçerli kullanıcı verisi içermiyor:", data);
      return false;
    } catch (error) {
      console.error("Oturum yenileme sırasında beklenmeyen hata:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log("Çıkış işlemi başlatıldı");
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Cookie'leri dahil et
      });
      
      console.log("Çıkış isteği yanıtı:", response.status);
      
      // Kullanıcı state'ini temizle
      setUser(null);
      
      // Başarılı çıkış bildirimi
      if (typeof window !== 'undefined') {
        // Client-side olduğundan emin ol
        window.localStorage.removeItem("lastLoginTime");
        console.log("Çıkış başarılı, login sayfasına yönlendiriliyor");
      }
      
      // Login sayfasına yönlendir
      router.push("/login");
    } catch (error) {
      console.error("Çıkış yapılırken hata:", error);
      // Hata olsa bile login sayfasına yönlendir
      router.push("/login");
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, updateUser, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 