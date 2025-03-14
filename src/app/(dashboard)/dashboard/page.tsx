"use client";

import { useState, useEffect } from "react";
import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Clipboard, 
  FileCheck, 
  ShoppingCart, 
  FileText,
  Clock,
  ArrowRight,
  Plus,
  Search,
  Calendar,
  Bell,
  UserCircle
} from "lucide-react";
import { TodoList } from "@/components/dashboard/todo-list";
import { DashboardCalendar } from "@/components/dashboard/dashboard-calendar";
import { useAuth } from "@/lib/context/auth-context";
import { getRequests } from "@/lib/services/request-service";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

// Metadata artık client component'te tanımlanamadığı için siliyoruz
// export const metadata: Metadata = {
//   title: "Dashboard | IT Satınalma Yönetimi",
//   description: "IT Satınalma Süreç Yönetimi Sistemi Dashboard",
// };

export default function DashboardPage() {
  const { user } = useAuth();
  const [statsData, setStatsData] = useState({
    bekleyen: 0,
    onaylanan: 0,
    tamamlanan: 0,
    toplam: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Saat formatı: 14:30:45
      const timeString = now.toLocaleTimeString('tr-TR', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
      setCurrentTime(timeString);
    };
    
    updateTime();
    // Her saniye güncellenecek
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Bekleyen talepler
        const bekleyenResponse = await getRequests({ durum: "BEKLEMEDE" });
        // Onaylanan talepler
        const onaylananResponse = await getRequests({ durum: "ONAYLANDI" });
        // Tamamlanan talepler
        const tamamlananResponse = await getRequests({ durum: "TAMAMLANDI" });
        // Tüm talepler
        const tumTaleplerResponse = await getRequests();
        
        setStatsData({
          bekleyen: bekleyenResponse.data.length,
          onaylanan: onaylananResponse.data.length,
          tamamlanan: tamamlananResponse.data.length,
          toplam: tumTaleplerResponse.data.length
        });
        
        // Son aktiviteleri oluştur
        const allRequests = [...bekleyenResponse.data, ...onaylananResponse.data, ...tamamlananResponse.data]
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5);
          
        setActivities(allRequests);
      } catch (error) {
        console.error("Dashboard verileri yüklenirken hata:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchStats();
    }
  }, [user]);

  const stats = [
    {
      title: "Bekleyen Talepler",
      value: isLoading ? "-" : statsData.bekleyen.toString(),
      description: "Onay bekleyen",
      icon: <Clipboard className="h-4 w-4 text-muted-foreground" />,
      href: "/talepler?durum=BEKLEMEDE",
    },
    {
      title: "Onaylanan Talepler",
      value: isLoading ? "-" : statsData.onaylanan.toString(),
      description: "İşlem sürecinde",
      icon: <FileCheck className="h-4 w-4 text-muted-foreground" />,
      href: "/talepler?durum=ONAYLANDI",
    },
    {
      title: "Tamamlanan Talepler",
      value: isLoading ? "-" : statsData.tamamlanan.toString(),
      description: "Satınalma tamamlandı",
      icon: <ShoppingCart className="h-4 w-4 text-muted-foreground" />,
      href: "/talepler?durum=TAMAMLANDI",
    },
    {
      title: "Toplam Talepler",
      value: isLoading ? "-" : statsData.toplam.toString(),
      description: "Tüm zamanlar",
      icon: <FileText className="h-4 w-4 text-muted-foreground" />,
      href: "/talepler",
    },
  ];

  // Kullanıcı rolüne göre hızlı eylemler
  const quickActions = [
    {
      title: "Yeni Talep Oluştur",
      description: "Yeni bir IT satınalma talebi oluşturun",
      icon: <Plus className="h-5 w-5" />,
      href: "/talep-olustur",
    },
    {
      title: "Bekleyen Onaylarım",
      description: "Onayınızı bekleyen talepleri görüntüleyin",
      icon: <FileCheck className="h-5 w-5" />,
      href: "/bekleyenler",
    },
    {
      title: "Profil Ayarları",
      description: "Hesap bilgilerinizi ve tercihlerinizi yönetin",
      icon: <UserCircle className="h-5 w-5" />,
      href: "/profil",
    },
    {
      title: "Tüm Talepleri Görüntüle",
      description: "Tüm talepleri listeleyin ve filtreleyerek arayın",
      icon: <Search className="h-5 w-5" />,
      href: "/talepler",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Hoş Geldiniz</h2>
          <p className="text-muted-foreground mt-1">
            {user ? `${user.ad} ${user.soyad}, ${user.departman?.ad || "Departman Atanmamış"}` : "Yükleniyor..."}
          </p>
        </div>
        <div className="flex flex-col items-end space-y-1">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("tr-TR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {currentTime}
            </p>
          </div>
        </div>
      </div>
      
      {/* İstatistikler */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </>
              )}
            </CardContent>
            <CardFooter className="p-2 pt-0">
              <Link href={stat.href} className="text-xs text-primary flex items-center hover:underline ml-auto">
                Detaylar <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {/* Hızlı Eylemler */}
      <div>
        <h3 className="text-lg font-medium mb-4">Hızlı Eylemler</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => (
            <Card key={index} className="overflow-hidden hover:border-primary/50 transition-colors">
              <Link href={action.href} className="block h-full">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-md bg-primary/10">
                      {action.icon}
                    </div>
                    <CardTitle className="text-base font-medium">{action.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Ana İçerik */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Son Aktiviteler</CardTitle>
            <CardDescription>Son yapılan işlemler ve güncellemeler</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-md border p-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                    <Skeleton className="h-3 w-[50px]" />
                  </div>
                ))}
              </div>
            ) : activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-md border p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      {activity.durum === "BEKLEMEDE" ? (
                        <Clock className="h-4 w-4 text-primary" />
                      ) : activity.durum === "ONAYLANDI" ? (
                        <FileCheck className="h-4 w-4 text-primary" />
                      ) : (
                        <ShoppingCart className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">
                        {activity.baslik}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.talepEden?.ad} {activity.talepEden?.soyad} - {activity.departman?.ad}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(activity.updatedAt).toLocaleDateString("tr-TR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-8">
                <Clipboard className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Henüz aktivite yok</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Satınalma sistemi kullanılmaya başlandığında burada aktiviteler görünecek.
                </p>
                <Button asChild>
                  <Link href="/talep-olustur">Talep Oluştur</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Takvim & Yapılacaklar</CardTitle>
            <CardDescription>Yaklaşan etkinlikler ve yapılacaklar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <DashboardCalendar />
            <TodoList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 