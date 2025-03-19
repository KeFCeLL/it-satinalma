"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { KullaniciDuzenle } from "@/components/kullanicilar/kullanici-duzenle";
import { User } from "@/lib/services/user-service";

export default function KullaniciDuzenlePage() {
  const params = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/kullanicilar/${params.id}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Kullanıcı bilgileri alınamadı');
        }
        
        const data = await response.json();
        setUser(data.kullanici);
      } catch (error) {
        console.error('Kullanıcı bilgileri yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchUser();
    }
  }, [params.id]);

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  if (!user) {
    return <div>Kullanıcı bulunamadı</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Kullanıcı Düzenle</h1>
      <KullaniciDuzenle 
        user={user} 
        open={true} 
        onOpenChange={() => {}} 
        onSuccess={() => {
          // Başarılı güncelleme sonrası yönlendirme
          window.location.href = '/dashboard-all/kullanici-yonetimi';
        }}
      />
    </div>
  );
} 