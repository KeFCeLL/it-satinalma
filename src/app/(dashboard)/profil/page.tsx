"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileForm } from "@/components/profile/profile-form";
import { PasswordForm } from "@/components/profile/password-form";
import { NotificationForm } from "@/components/profile/notification-form";

export default function ProfilPage() {
  const { user, isLoading } = useAuth();

  // Kullanıcı görüntüsü yoksa baş harflerini göster
  const getInitials = () => {
    if (!user) return "??";
    return `${user.ad.charAt(0)}${user.soyad.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Profil Ayarları</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Profil özeti kartı */}
        <Card className="md:w-1/3">
          <CardHeader>
            <CardTitle>Profil Bilgileri</CardTitle>
            <CardDescription>
              Hesap bilgileriniz ve giriş detaylarınız
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center">
            <div className="space-y-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-24 w-24 rounded-full mx-auto" />
                  <Skeleton className="h-4 w-32 mx-auto" />
                  <Skeleton className="h-4 w-48 mx-auto" />
                  <Skeleton className="h-4 w-40 mx-auto" />
                </>
              ) : (
                <>
                  <Avatar className="h-24 w-24">
                    <AvatarImage src="" alt={user?.ad || "Kullanıcı"} />
                    <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-bold">
                    {user?.ad} {user?.soyad}
                  </h3>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <div className="flex items-center justify-center gap-2">
                    <div className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">
                      {user?.rol}
                    </div>
                    <div className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">
                      {user?.departman?.ad || "Departman atanmamış"}
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ayarlar sekmesi */}
        <div className="flex-1">
          <Tabs defaultValue="profile">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profil</TabsTrigger>
              <TabsTrigger value="password">Şifre</TabsTrigger>
              <TabsTrigger value="notifications">Bildirimler</TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profil Bilgileri</CardTitle>
                  <CardDescription>
                    Kişisel bilgilerinizi düzenleyin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfileForm />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="password" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Şifre Değiştir</CardTitle>
                  <CardDescription>
                    Hesap güvenliğiniz için şifrenizi düzenli olarak değiştirin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PasswordForm />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="notifications" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bildirim Ayarları</CardTitle>
                  <CardDescription>
                    Hangi durumlarda bildirim almak istediğinizi yapılandırın
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <NotificationForm />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 