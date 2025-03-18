"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserX,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { User } from "@/lib/services/user-service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { KullaniciDuzenle } from "./kullanici-duzenle";
import { fetchWithoutCache } from "@/lib/api-config";

export function KullaniciListe() {
  const router = useRouter();
  const [users, setUsers] = useState<(User & { durum?: 'AKTIF' | 'PASIF' })[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [userToEdit, setUserToEdit] = useState<User & { durum?: 'AKTIF' | 'PASIF' } | null>(null);

  // Kullanıcıları getir
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // API isteği
      const response = await fetchWithoutCache(`/api/kullanicilar?hepsi=true`);
      console.log('📊 Kullanıcılar API yanıtı:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`API hatası: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📋 Kullanıcılar veri:', data);
      
      if (data.success && data.kullanicilar && Array.isArray(data.kullanicilar)) {
        // Her kullanıcıya durum bilgisi ekle (eğer yoksa)
        const usersWithStatus = data.kullanicilar.map((user: any) => ({
          ...user,
          durum: user.durum || 'AKTIF' // Varsayılan olarak AKTIF
        }));
        
        setUsers(usersWithStatus);
      } else if (data.data && Array.isArray(data.data)) {
        // Eski API formatı desteği
        const usersWithStatus = data.data.map((user: any) => ({
          ...user,
          durum: user.durum || 'AKTIF' // Varsayılan olarak AKTIF
        }));
        
        setUsers(usersWithStatus);
      } else {
        toast.error("API'den beklenen formatta veri alınamadı");
        setUsers([]);
      }
    } catch (error) {
      console.error("Kullanıcılar yüklenirken hata:", error);
      toast.error("Kullanıcılar yüklenirken bir hata oluştu");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtre işlemi
  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true;
    const searchTermLower = searchTerm.toLowerCase();
    return (
      user.ad?.toLowerCase().includes(searchTermLower) ||
      user.soyad?.toLowerCase().includes(searchTermLower) ||
      user.email?.toLowerCase().includes(searchTermLower) ||
      user.rol?.toLowerCase().includes(searchTermLower)
    );
  });

  // Kullanıcı silme işlevi
  const handleDeleteUser = async (user: User) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  // Kullanıcı silme onaylama
  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      const response = await fetch(`/api/kullanicilar/${userToDelete.id}`, {
        method: "DELETE",
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Sunucu hatası: ${response.status}`);
      }
      
      toast.success(`${userToDelete.ad} ${userToDelete.soyad} kullanıcısı silindi.`);
      fetchUsers(); // Listeyi yenile
    } catch (error: any) {
      console.error("Kullanıcı silme hatası:", error);
      toast.error(`Kullanıcı silinirken hata oluştu: ${error.message}`);
    } finally {
      setShowDeleteDialog(false);
      setUserToDelete(null);
    }
  };

  // Kullanıcı durumunu değiştirme
  const handleToggleStatus = async (user: User & { durum?: 'AKTIF' | 'PASIF' }) => {
    const newStatus = user.durum === "AKTIF" ? "PASIF" : "AKTIF";
    
    try {
      const response = await fetch(`/api/kullanicilar/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ durum: newStatus }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Sunucu hatası: ${response.status}`);
      }
      
      toast.success(`${user.ad} ${user.soyad} kullanıcısı ${newStatus === "AKTIF" ? "aktif" : "pasif"} duruma getirildi.`);
      fetchUsers(); // Listeyi yenile
    } catch (error: any) {
      console.error("Kullanıcı durumu değiştirme hatası:", error);
      toast.error(`Kullanıcı durumu değiştirilirken hata oluştu: ${error.message}`);
    }
  };

  // Kullanıcı düzenleme
  const handleEditUser = (user: User & { durum?: 'AKTIF' | 'PASIF' }) => {
    setUserToEdit(user);
    setShowEditDialog(true);
  };

  // Tablo sütunları
  const columns: ColumnDef<User & { durum?: 'AKTIF' | 'PASIF' }>[] = [
    {
      accessorKey: "ad",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Ad
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.ad} {row.original.soyad}
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          E-posta
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "rol",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Rol
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const rolMap: Record<string, string> = {
          ADMIN: "Sistem Yöneticisi",
          SATINALMA_ADMIN: "Satınalma Yöneticisi", 
          IT_ADMIN: "IT Yöneticisi",
          FINANS_ADMIN: "Finans Yöneticisi",
          DEPARTMAN_YONETICISI: "Departman Yöneticisi",
          KULLANICI: "Standart Kullanıcı"
        };
        
        return <div>{rolMap[row.original.rol] || row.original.rol}</div>;
      },
    },
    {
      accessorKey: "durum",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Durum
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const durum = row.original.durum || "AKTIF";
        return (
          <Badge variant={durum === "AKTIF" ? "default" : "destructive"}>
            {durum === "AKTIF" ? "Aktif" : "Pasif"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        const durum = user.durum || "AKTIF";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Menüyü aç</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                <Pencil className="mr-2 h-4 w-4" />
                Düzenle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                {durum === "AKTIF" ? (
                  <>
                    <UserX className="mr-2 h-4 w-4" />
                    Pasif Yap
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Aktif Yap
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteUser(user)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Sil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Kullanıcı Listesi</h2>
        <Button onClick={() => {
          const event = new CustomEvent('change-tab', { detail: 'kullanici-ekle' });
          window.dispatchEvent(event);
        }}>
          Yeni Kullanıcı Ekle
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filteredUsers}
        loading={loading}
        searchPlaceholder="Kullanıcı ara..."
      />

      {/* Silme onay iletişim kutusu */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kullanıcı Silme</AlertDialogTitle>
            <AlertDialogDescription>
              {userToDelete && (
                <>
                  <strong>
                    {userToDelete.ad} {userToDelete.soyad}
                  </strong>{" "}
                  kullanıcısını silmek istediğinizden emin misiniz? Bu işlem geri
                  alınamaz.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Evet, Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Düzenleme iletişim kutusu */}
      {userToEdit && (
        <KullaniciDuzenle
          user={userToEdit}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={fetchUsers}
        />
      )}
    </div>
  );
} 