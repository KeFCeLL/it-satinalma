"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DashboardNav } from "./dashboard-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Menu, Bell } from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { getNotifications, Notification } from "@/lib/services";

export function DashboardHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Okunmamış bildirim sayısını ve bildirimleri getir
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await getNotifications({ okundu: false, sayfa: 1, sayfaBasi: 5 });
        setUnreadCount(response.okunmamisSayisi);
        // API'den gelen bildirimler dizisini güvenli bir şekilde al
        if (response.data && Array.isArray(response.data)) {
          setNotifications(response.data);
        } else {
          setNotifications([]); // Veya varsayılan bir dizi
        }
      } catch (error) {
        console.error("Bildirimler alınamadı:", error);
      }
    };

    if (user) {
      fetchNotifications();
      // Her 30 saniyede bir bildirimleri güncelle
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Kullanıcı adının baş harflerini al
  const getInitials = () => {
    if (!user) return "??";
    return `${user.ad.charAt(0)}${user.soyad.charAt(0)}`;
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container flex h-14 items-center">
        <div className="flex items-center space-x-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <DashboardNav />
            </SheetContent>
          </Sheet>
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/images/logo.png"
              alt="Green Chemicals Logo"
              width={120}
              height={50}
              className="h-auto"
            />
            <span className="font-bold hidden md:inline">Green Chemicals</span>
          </Link>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-4">
            {user && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>Bildirimler</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications.length > 0 ? (
                      <>
                        {notifications.map((notification, index) => (
                          <DropdownMenuItem key={notification.id || index} className="cursor-pointer py-2 px-4">
                            <div className="flex flex-col space-y-1">
                              <p className="text-sm font-medium">{notification.baslik}</p>
                              <p className="text-xs text-muted-foreground">{notification.icerik}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(notification.createdAt).toLocaleString('tr-TR')}
                              </p>
                            </div>
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/bildirimler" className="w-full text-center text-sm text-blue-500">
                            Tüm Bildirimleri Görüntüle
                          </Link>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <div className="py-4 px-4 text-center text-sm text-muted-foreground">
                        Yeni bildiriminiz bulunmamaktadır.
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar>
                        <AvatarImage src="" />
                        <AvatarFallback>{getInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      {user.ad} {user.soyad}
                    </DropdownMenuLabel>
                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profil">Profil</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Çıkış Yap</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
} 