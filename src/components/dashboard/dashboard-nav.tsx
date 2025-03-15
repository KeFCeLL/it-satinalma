"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/auth-context";
import {
  Clipboard,
  LayoutDashboard,
  ShoppingCart,
  FileCheck,
  Settings,
  FilePlus,
  LogOut,
  Package2,
  Users,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard-all",
    icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
  },
  {
    title: "Talepler",
    href: "/dashboard-all/talepler",
    icon: <Clipboard className="mr-2 h-4 w-4" />,
  },
  {
    title: "Talep Oluştur",
    href: "/dashboard-all/talep-olustur",
    icon: <FilePlus className="mr-2 h-4 w-4" />,
  },
  {
    title: "Bekleyenler",
    href: "/dashboard-all/bekleyenler",
    icon: <FileCheck className="mr-2 h-4 w-4" />,
  },
  {
    title: "Satınalma",
    href: "/dashboard-all/satinalma",
    icon: <ShoppingCart className="mr-2 h-4 w-4" />,
  },
  {
    title: "Profil",
    href: "/dashboard-all/profil",
    icon: <Settings className="mr-2 h-4 w-4" />,
  },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Admin ve IT_ADMIN kullanıcıları için ek menü öğelerini oluştur
  const adminNavItems: NavItem[] = [
    {
      title: "Ürün Yönetimi",
      href: "/dashboard-all/urun-yonetimi",
      icon: <Package2 className="mr-2 h-4 w-4" />,
    },
    {
      title: "Kullanıcı Yönetimi",
      href: "/dashboard-all/kullanici-yonetimi",
      icon: <Users className="mr-2 h-4 w-4" />,
    },
  ];

  // Kullanıcının rolüne göre görüntülenecek menü öğelerini belirle
  const displayNavItems = [...navItems];
  if (user && (user.rol === "ADMIN" || user.rol === "IT_ADMIN")) {
    displayNavItems.push(...adminNavItems);
  }

  return (
    <nav className="grid items-start gap-2 px-2 py-4">
      {displayNavItems.map((item, index) => (
        <Link
          key={index}
          href={item.href}
          className={cn(
            "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
            pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
          )}
        >
          {item.icon}
          {item.title}
        </Link>
      ))}
      <div className="mt-auto border-t pt-4">
        <Button 
          variant="outline" 
          className="w-full justify-start" 
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Çıkış Yap
        </Button>
      </div>
    </nav>
  );
} 