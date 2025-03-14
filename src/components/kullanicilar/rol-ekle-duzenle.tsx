"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Pencil, Plus, Trash2, Search, RefreshCw, Key } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Rol tipi
type Role = {
  id: string;
  name: string;
  code: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

// Form şeması
const roleFormSchema = z.object({
  name: z.string().min(2, "Rol adı en az 2 karakter olmalıdır"),
  code: z.string().min(2, "Kod en az 2 karakter olmalıdır"),
  description: z.string().optional(),
});

export function RolEkleDuzenle() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);

  // Form tanımlaması
  const form = useForm<z.infer<typeof roleFormSchema>>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
    },
  });

  // Rolleri yükle
  useEffect(() => {
    fetchRoles();
  }, []);

  // Arama filtresini uygula
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredRoles(roles);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      const filtered = roles.filter(
        (role) =>
          role.name.toLowerCase().includes(lowercasedSearch) ||
          role.code.toLowerCase().includes(lowercasedSearch) ||
          (role.description && role.description.toLowerCase().includes(lowercasedSearch))
      );
      setFilteredRoles(filtered);
    }
  }, [searchTerm, roles]);

  // Şu anda backend tarafında özel bir rol API'si olmadığı için 
  // burada sahte bir veri kümesi kullanıyoruz, 
  // ileride API ile değiştirilecek
  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      // Gerçek API çağrısı yerine şimdilik mock data
      const mockRoles: Role[] = [
        {
          id: "1",
          name: "Sistem Yöneticisi",
          code: "ADMIN",
          description: "Tam sistem erişimi olan yönetici rolü",
          createdAt: "2023-01-01T00:00:00.000Z",
          updatedAt: "2023-01-01T00:00:00.000Z",
        },
        {
          id: "2",
          name: "IT Yöneticisi",
          code: "IT_ADMIN",
          description: "IT departmanı yönetici rolü",
          createdAt: "2023-01-01T00:00:00.000Z",
          updatedAt: "2023-01-01T00:00:00.000Z",
        },
        {
          id: "3",
          name: "Finans Yöneticisi",
          code: "FINANS_ADMIN",
          description: "Finans departmanı yönetici rolü",
          createdAt: "2023-01-01T00:00:00.000Z",
          updatedAt: "2023-01-01T00:00:00.000Z",
        },
        {
          id: "4",
          name: "Satınalma Yöneticisi",
          code: "SATINALMA_ADMIN",
          description: "Satınalma departmanı yönetici rolü",
          createdAt: "2023-01-01T00:00:00.000Z",
          updatedAt: "2023-01-01T00:00:00.000Z",
        },
        {
          id: "5",
          name: "Departman Yöneticisi",
          code: "DEPARTMAN_YONETICISI",
          description: "Genel departman yönetici rolü",
          createdAt: "2023-01-01T00:00:00.000Z",
          updatedAt: "2023-01-01T00:00:00.000Z",
        },
        {
          id: "6",
          name: "Standart Kullanıcı",
          code: "KULLANICI",
          description: "Temel kullanıcı erişimi",
          createdAt: "2023-01-01T00:00:00.000Z",
          updatedAt: "2023-01-01T00:00:00.000Z",
        },
      ];
      
      // Rolleri ayarla
      setRoles(mockRoles);
      setFilteredRoles(mockRoles);
    } catch (error: any) {
      toast.error(`Roller yüklenirken hata oluştu: ${error.message}`);
      setRoles([]);
      setFilteredRoles([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Rol ekleme/güncelleme
  const handleSubmit = async (values: z.infer<typeof roleFormSchema>) => {
    try {
      // Şimdilik API çağrısı simülasyonu
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (editingRole) {
        // Güncelleme simülasyonu
        setRoles(roles.map(role => 
          role.id === editingRole.id 
            ? { 
                ...role, 
                name: values.name, 
                code: values.code, 
                description: values.description || "",
                updatedAt: new Date().toISOString()
              } 
            : role
        ));
        toast.success(`${values.name} rolü başarıyla güncellendi`);
      } else {
        // Yeni ekleme simülasyonu
        const newRole: Role = {
          id: (roles.length + 1).toString(),
          name: values.name,
          code: values.code,
          description: values.description || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setRoles([...roles, newRole]);
        toast.success(`${values.name} rolü başarıyla oluşturuldu`);
      }
      
      setIsDialogOpen(false);
      form.reset();
    } catch (error: any) {
      toast.error(`İşlem sırasında hata oluştu: ${error.message}`);
    }
  };

  // Rol silme
  const handleDeleteRole = async () => {
    if (!deletingRoleId) return;

    try {
      // Silme simülasyonu
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setRoles(roles.filter(role => role.id !== deletingRoleId));
      toast.success("Rol başarıyla silindi");
      setDeleteDialogOpen(false);
      setDeletingRoleId(null);
    } catch (error: any) {
      toast.error(`Rol silinirken hata oluştu: ${error.message}`);
    }
  };

  // Düzenleme için rol ayarla
  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    form.reset({
      name: role.name,
      code: role.code,
      description: role.description || "",
    });
    setIsDialogOpen(true);
  };

  // Yeni rol ekleme
  const handleAddNewRole = () => {
    setEditingRole(null);
    form.reset({
      name: "",
      code: "",
      description: "",
    });
    setIsDialogOpen(true);
  };

  // Silme işlemi için rol seç
  const handleDeleteDialog = (roleId: string) => {
    setDeletingRoleId(roleId);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Rol Yönetimi</CardTitle>
          <CardDescription>
            Sistem rollerini görüntüleyin, ekleyin, düzenleyin ve silin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rol ara..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={handleAddNewRole}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Rol
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Rol Adı</TableHead>
                    <TableHead>Kod</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Rol bulunamadı
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRoles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.id}</TableCell>
                        <TableCell>{role.name}</TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="flex items-center">
                                  <Key className="h-3.5 w-3.5 mr-1.5" />
                                  {role.code}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Sistem içinde kullanılan kod</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>{role.description || "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditRole(role)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteDialog(role.id)}
                              disabled={role.code === "ADMIN"} // Admin rolü silinemez
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Rol Ekle/Düzenle Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Rolü Düzenle" : "Yeni Rol Ekle"}
            </DialogTitle>
            <DialogDescription>
              {editingRole
                ? "Rol bilgilerini güncelleyin"
                : "Sisteme yeni bir rol ekleyin"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol Adı</FormLabel>
                    <FormControl>
                      <Input placeholder="Rol adı" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kod</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Örn: ADMIN, KULLANICI" 
                        {...field} 
                        disabled={editingRole?.code === "ADMIN"} // Admin rolünün kodu değiştirilemez
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Açıklama</FormLabel>
                    <FormControl>
                      <Input placeholder="Rol açıklaması" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  İptal
                </Button>
                <Button type="submit">
                  {editingRole ? "Güncelle" : "Oluştur"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Silme Onay Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rol Silme Onayı</AlertDialogTitle>
            <AlertDialogDescription>
              Bu rolü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve
              bu role sahip kullanıcılar etkilenebilir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRole}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 