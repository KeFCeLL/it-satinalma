"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, Shield, ListChecks, Building, KeySquare } from "lucide-react";
import { KullaniciListe } from "./kullanici-liste";
import { KullaniciEkle } from "./kullanici-ekle";
import { RolYonetimi } from "./rol-yonetimi";
import { TopluIslemler } from "./toplu-islemler";
import { DepartmanYonetimi } from "./departman-yonetimi";
import { RolEkleDuzenle } from "./rol-ekle-duzenle";

export function KullaniciYonetimiWrapper() {
  const [activeTab, setActiveTab] = useState("kullanici-liste");

  // Tab değiştirme olayını dinlemek için event listener ekliyorum
  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      setActiveTab(event.detail);
    };

    // Event listener'ı ekle
    window.addEventListener('change-tab', handleTabChange as EventListener);

    // Component unmount olduğunda event listener'ı kaldır
    return () => {
      window.removeEventListener('change-tab', handleTabChange as EventListener);
    };
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kullanıcı Yönetimi</h1>
        <p className="text-muted-foreground">
          Kullanıcıları görüntüleyin, düzenleyin, ekleyin ve rollerini yönetin
        </p>
      </div>

      <Tabs
        defaultValue="kullanici-liste"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Kullanıcı Yönetimi</CardTitle>
            <CardDescription>
              Sistem kullanıcılarını, rolleri ve departmanları yönetin
            </CardDescription>
            <TabsList className="grid grid-cols-2 md:grid-cols-6 mt-6">
              <TabsTrigger value="kullanici-liste">
                <Users className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Kullanıcı Listesi</span>
                <span className="sm:hidden">Liste</span>
              </TabsTrigger>
              <TabsTrigger value="kullanici-ekle">
                <UserPlus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Kullanıcı Ekle</span>
                <span className="sm:hidden">Ekle</span>
              </TabsTrigger>
              <TabsTrigger value="rol-yonetimi">
                <Shield className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Rol Yönetimi</span>
                <span className="sm:hidden">Roller</span>
              </TabsTrigger>
              <TabsTrigger value="departman-yonetimi">
                <Building className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Departman Yönetimi</span>
                <span className="sm:hidden">Departmanlar</span>
              </TabsTrigger>
              <TabsTrigger value="rol-ekle-duzenle">
                <KeySquare className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Rol Ekle/Düzenle</span>
                <span className="sm:hidden">Rol+</span>
              </TabsTrigger>
              <TabsTrigger value="toplu-islemler">
                <ListChecks className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Toplu İşlemler</span>
                <span className="sm:hidden">Toplu</span>
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="p-0">
            <TabsContent
              value="kullanici-liste"
              className="m-0 p-4 border-0"
            >
              <KullaniciListe />
            </TabsContent>
            <TabsContent
              value="kullanici-ekle"
              className="m-0 p-4 border-0"
            >
              <KullaniciEkle onSuccess={() => {
                // Kullanıcı başarıyla eklendiğinde liste sayfasına yönlendir
                setActiveTab("kullanici-liste");
              }} />
            </TabsContent>
            <TabsContent
              value="rol-yonetimi"
              className="m-0 p-4 border-0"
            >
              <RolYonetimi />
            </TabsContent>
            <TabsContent
              value="departman-yonetimi"
              className="m-0 p-4 border-0"
            >
              <DepartmanYonetimi />
            </TabsContent>
            <TabsContent
              value="rol-ekle-duzenle"
              className="m-0 p-4 border-0"
            >
              <RolEkleDuzenle />
            </TabsContent>
            <TabsContent
              value="toplu-islemler"
              className="m-0 p-4 border-0"
            >
              <TopluIslemler />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
} 