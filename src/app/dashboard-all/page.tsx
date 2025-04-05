"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Clipboard, 
  FileCheck, 
  ShoppingCart, 
  FileText,
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { TodoList } from "@/components/dashboard/todo-list";
import { DashboardCalendar } from "@/components/dashboard/dashboard-calendar";
import { WeatherWidget } from "@/components/dashboard/weather-widget";
import { FinanceWidget } from "@/components/dashboard/finance-widget";
import Link from "next/link";
import { AnalogClock } from "@/components/dashboard/analog-clock";

interface DashboardStats {
  bekleyenTalepler: number;
  bekleyenTaleplerSonYediGun: number;
  onaylananTaleplerSonOtuzGun: number;
  tamamlananTaleplerSonOtuzGun: number;
  toplamTalepler: number;
}

interface Activity {
  id: string;
  baslik: string;
  durum: string;
  updatedAt: string;
  departman: {
    ad: string;
  };
  talepEden: {
    ad: string;
    soyad: string;
  };
  onaylar: Array<{
    durum: string;
    onaylayan: {
      departman: {
        ad: string;
      };
    };
  }>;
}

function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/stats');
        if (!response.ok) {
          throw new Error('İstatistikler alınamadı');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
        console.error('Dashboard istatistikleri hatası:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchActivities = async () => {
      try {
        setActivitiesLoading(true);
        const response = await fetch('/api/dashboard/activities');
        if (!response.ok) {
          throw new Error('Aktiviteler alınamadı');
        }
        const data = await response.json();
        setActivities(data);
      } catch (err) {
        setActivitiesError(err instanceof Error ? err.message : 'Bir hata oluştu');
        console.error('Aktiviteler hatası:', err);
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchStats();
    fetchActivities();
  }, []);

  const statCards = [
    {
      title: "Bekleyen Talepler",
      value: loading ? "-" : stats?.bekleyenTaleplerSonYediGun.toString() || "0",
      description: "Son 7 gün",
      icon: <Clipboard className="h-4 w-4 text-muted-foreground" />,
      href: "/dashboard-all/talepler?status=bekleyen",
    },
    {
      title: "Onaylanan Talepler",
      value: loading ? "-" : stats?.onaylananTaleplerSonOtuzGun.toString() || "0",
      description: "Son 30 gün",
      icon: <FileCheck className="h-4 w-4 text-muted-foreground" />,
      href: "/dashboard-all/talepler?status=onaylanan",
    },
    {
      title: "Tamamlanan Talepler",
      value: loading ? "-" : stats?.tamamlananTaleplerSonOtuzGun.toString() || "0",
      description: "Son 30 gün",
      icon: <ShoppingCart className="h-4 w-4 text-muted-foreground" />,
      href: "/dashboard-all/talepler?status=tamamlanan",
    },
    {
      title: "Toplam Talepler",
      value: loading ? "-" : stats?.toplamTalepler.toString() || "0",
      description: "Tüm zamanlar",
      icon: <FileText className="h-4 w-4 text-muted-foreground" />,
      href: "/dashboard-all/talepler",
    },
  ];

  const getActivityIcon = (durum: string) => {
    switch (durum) {
      case 'ONAYLANDI':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'REDDEDILDI':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'BEKLEMEDE':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'TAMAMLANDI':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    const sonOnay = activity.onaylar[0];
    const departmanAdi = sonOnay?.onaylayan?.departman?.ad || activity.departman.ad;
    
    switch (activity.durum) {
      case 'ONAYLANDI':
        return `${activity.baslik} onaylandı`;
      case 'REDDEDILDI':
        return `${activity.baslik} reddedildi`;
      case 'BEKLEMEDE':
        return `${activity.baslik} için onay bekleniyor`;
      case 'TAMAMLANDI':
        return `${activity.baslik} tamamlandı`;
      default:
        return activity.baslik;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("tr-TR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Son Aktiviteler</CardTitle>
            <CardDescription>Son yapılan işlemler ve güncellemeler</CardDescription>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-md border p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
                      <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activitiesError ? (
              <div className="text-sm text-red-500">{activitiesError}</div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <Link 
                    key={activity.id} 
                    href={`/dashboard-all/talepler/${activity.id}`}
                    className="flex items-center gap-4 rounded-md border p-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      {getActivityIcon(activity.durum)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">
                        {getActivityText(activity)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.departman.ad} departmanı tarafından
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(activity.updatedAt).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="col-span-3 space-y-4">
          <WeatherWidget />
          <FinanceWidget />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Takvim & Yapılacaklar</CardTitle>
          <CardDescription>Yaklaşan etkinlikler ve yapılacaklar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-[1fr_auto]">
            <div className="space-y-5">
              <DashboardCalendar />
              <TodoList />
            </div>
            <div className="w-fit">
              <AnalogClock />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <DashboardContent />
    </Suspense>
  );
} 