"use client";

import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Clipboard, 
  FileCheck, 
  ShoppingCart, 
  FileText,
  Clock
} from "lucide-react";
import { TodoList } from "@/components/dashboard/todo-list";
import { DashboardCalendar } from "@/components/dashboard/dashboard-calendar";

function DashboardContent() {
  const stats = [
    {
      title: "Bekleyen Talepler",
      value: "12",
      description: "Son 7 gün",
      icon: <Clipboard className="h-4 w-4 text-muted-foreground" />,
      href: "/talepler?status=bekleyen",
    },
    {
      title: "Onaylanan Talepler",
      value: "24",
      description: "Son 30 gün",
      icon: <FileCheck className="h-4 w-4 text-muted-foreground" />,
      href: "/talepler?status=onaylanan",
    },
    {
      title: "Tamamlanan Talepler",
      value: "16",
      description: "Son 30 gün",
      icon: <ShoppingCart className="h-4 w-4 text-muted-foreground" />,
      href: "/talepler?status=tamamlanan",
    },
    {
      title: "Toplam Talepler",
      value: "132",
      description: "Tüm zamanlar",
      icon: <FileText className="h-4 w-4 text-muted-foreground" />,
      href: "/talepler",
    },
  ];

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
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
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
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-md border p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    {i % 2 === 0 ? <FileCheck className="h-4 w-4 text-primary" /> : <ShoppingCart className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">
                      {i % 2 === 0 ? "Laptop talebi onaylandı" : "Monitor siparişi tamamlandı"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {i % 2 === 0 ? "IT Departmanı" : "Satınalma Departmanı"} tarafından
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(Date.now() - 1000 * 60 * 60 * (i + 1) * 3).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))}
            </div>
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

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <DashboardContent />
    </Suspense>
  );
} 