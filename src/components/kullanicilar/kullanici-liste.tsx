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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchBar } from '@/components/search-bar';
import { Rol } from '@/lib/validation/kullanici';
import { useMutation, useQuery } from '@tanstack/react-query';
import { formatDate } from '@/lib/utils';

// Rol renklerini tanımla
const rolBadgeColors: Record<Rol, string> = {
  ADMIN: 'bg-red-500',
  MANAGER: 'bg-blue-500',
  USER: 'bg-green-500',
  SATINALMA_ADMIN: 'bg-purple-500',
  IT_ADMIN: 'bg-orange-500',
  FINANS_ADMIN: 'bg-yellow-500',
  DEPARTMAN_YONETICISI: 'bg-indigo-500',
  KULLANICI: 'bg-green-500',
};

// Departman ID'lerini isimlere çevir
const departmanIdToName: Record<string, string> = {
  'dep_bilgi_teknolojileri': 'Bilgi Teknolojileri',
  'dep_insan_kaynaklari': 'İnsan Kaynakları',
  'dep_finans': 'Finans',
  'dep_operasyon': 'Operasyon',
  'dep_satis': 'Satış',
  'dep_pazarlama': 'Pazarlama',
  'dep_hukuk': 'Hukuk',
  'dep_ar_ge': 'AR-GE',
  'dep_kalite': 'Kalite',
  // Diğer departman ID'leri ve isimleri
};

// Kullanıcı tipi
interface Kullanici {
  id: string;
  email: string;
  ad: string;
  soyad: string;
  rol: Rol;
  departmanId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function KullaniciListe() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [userToEdit, setUserToEdit] = useState<Kullanici | null>(null);
  const queryClient = { invalidateQueries: (config: any) => {} }; // Geçici olarak mock ettik
  const [kullanicilar, setKullanicilar] = useState<Kullanici[]>([]);
  const [error, setError] = useState(null);
  const [filtreler, setFiltreler] = useState({
    arama: '',
    departmanId: '',
    role: '',
    status: ''
  });

  // LocalStorage'dan kullanıcıları al
  const getLocalStorageUsers = () => {
    try {
      const savedUsers = localStorage.getItem('it_satinalma_users');
      if (savedUsers) {
        const parsedUsers = JSON.parse(savedUsers);
        setKullanicilar(parsedUsers);
        return parsedUsers;
      }
    } catch (error) {
      console.error('LocalStorage okuma hatası:', error);
    }
    return [];
  };

  // Kullanıcıları yükle
  const fetchKullanicilar = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        hepsi: 'true', // Tüm kullanıcıları getir
        ...filtreler
      });
      
      const response = await fetch(`/api/kullanicilar?${params}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Kullanıcılar getirilemedi');
      }
      
      setKullanicilar(data.kullanicilar);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Kullanıcılar getirilirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  // Component mount olduğunda kullanıcıları getir
  useEffect(() => {
    fetchKullanicilar();
  }, [filtreler]);

  // Filtrelenmiş kullanıcılar
  const filteredKullanicilar = kullanicilar.filter((kullanici: Kullanici) => {
    const searchContent = `${kullanici.ad} ${kullanici.soyad} ${kullanici.email} ${kullanici.rol}`.toLowerCase();
    return searchContent.includes(searchTerm.toLowerCase());
  });

  // Kullanıcı düzenleme modalını aç
  const handleEdit = (kullanici: Kullanici) => {
    setUserToEdit(kullanici);
    setShowEditDialog(true);
  };

  // Düzenleme modalını kapat
  const handleEditDialogClose = () => {
    setShowEditDialog(false);
    setUserToEdit(null);
  };

  // Düzenleme başarılı olduğunda
  const handleEditSuccess = () => {
    fetchKullanicilar(); // Kullanıcı listesini yenile
    handleEditDialogClose();
  };

  // Silme işlemini başlat
  const handleDelete = (id: string) => {
    setSelectedUserId(id);
    setOpenDeleteDialog(true);
  };

  // Silme işlemini gerçekleştir
  const confirmDelete = async () => {
    if (!selectedUserId) return;
    
    setLoading(true);
    try {
      // Önce localStorage'dan sil
      const currentUsers = getLocalStorageUsers();
      const updatedUsers = currentUsers.filter(user => user.id !== selectedUserId);
      localStorage.setItem('it_satinalma_users', JSON.stringify(updatedUsers));
      setKullanicilar(updatedUsers);
      
      // API'den sil
      const response = await fetch(`/api/kullanicilar/${selectedUserId}`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'X-Force-No-Mock': 'true'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.warn('⚠️ API silme hatası, ancak localStorage güncellendi:', response.status);
      }
      
      toast.success('Kullanıcı başarıyla silindi!');
    } catch (error) {
      console.error('❌ Kullanıcı silme hatası:', error);
      toast.error('Kullanıcı silinirken bir hata oluştu!');
    } finally {
      setLoading(false);
      setOpenDeleteDialog(false);
      setSelectedUserId(null);
    }
  };

  // Tablo sütunları
  const columns: ColumnDef<Kullanici>[] = [
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
        const durum = row.original.status || "AKTIF";
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
        const durum = user.status || "AKTIF";

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
              <DropdownMenuItem onClick={() => handleEdit(user)}>
                <Pencil className="mr-2 h-4 w-4" />
                Düzenle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDelete(user.id)}>
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
        data={filteredKullanicilar}
        loading={loading}
        searchPlaceholder="Kullanıcı ara..."
      />

      {/* Düzenleme Modalı */}
      {userToEdit && (
        <KullaniciDuzenle
          user={userToEdit}
          open={showEditDialog}
          onOpenChange={handleEditDialogClose}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Silme Dialog'u */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kullanıcıyı silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bu kullanıcı kalıcı olarak silinecek.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? 'Siliniyor...' : 'Sil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 