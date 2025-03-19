"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Info, Save, RefreshCw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  getRolesWithPermissions, 
  updateRolePermissions, 
  seedPermissions,
  createRole,
  updateRole,
  deleteRole,
  type Role as RoleType,
  type Permission as PermissionType,
  type PermissionCategory as PermissionCategoryType
} from "@/lib/services";

// Rol tipleri
type Role = 'ADMIN' | 'IT_ADMIN' | 'FINANS_ADMIN' | 'SATINALMA_ADMIN' | 'DEPARTMAN_YONETICISI' | 'KULLANICI';

// Arayüz izin tanımları
interface Permission {
  id: string;
  name: string;
  description: string;
  defaultRoles: Role[];
}

// İzin kategorileri
interface PermissionCategory {
  name: string;
  description: string;
  permissions: Permission[];
}

export function RolYonetimi() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Role>('ADMIN');
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [roles, setRoles] = useState<{ id: Role; name: string }[]>([]);
  const [permissionCategories, setPermissionCategories] = useState<PermissionCategory[]>([]);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [initialRolePermissions, setInitialRolePermissions] = useState<Record<string, string[]>>({});
  
  // API'den rol ve izin verilerini yükle
  useEffect(() => {
    const loadRolesAndPermissions = async () => {
      try {
        setLoading(true);
        
        // Eğer db'de henüz izin yoksa, varsayılan izinleri ekle
        await seedInitialPermissionsIfNeeded();
        
        // Rolleri ve izinleri getir
        const response = await getRolesWithPermissions();
        
        if (!response) {
          throw new Error('API yanıtı alınamadı');
        }

        if (!response.success) {
          throw new Error(response.message || 'Roller getirilirken bir hata oluştu');
        }
        
        if (response && response.roles && response.permissionCategories) {
          // Rolleri ayarla
          setRoles(response.roles.map(role => ({
            id: role.id as Role,
            name: role.name
          })));
          
          // Rol izinlerini ayarla
          const permissions: Record<string, string[]> = {};
          response.roles.forEach(role => {
            permissions[role.id] = role.permissions || [];
          });
          setRolePermissions(permissions);
          setInitialRolePermissions(JSON.parse(JSON.stringify(permissions)));
          
          // API'den gelen izin kategorilerini UI için dönüştür
          const uiPermissionCategories = transformPermissionCategories(response.permissionCategories);
          setPermissionCategories(uiPermissionCategories);
          
          // Aktif rol için varsayılan rol seç
          if (response.roles.length > 0) {
            setActiveTab(response.roles[0].id as Role);
          }
          
          setInitialDataLoaded(true);
        } else {
          throw new Error('Geçersiz API yanıtı formatı');
        }
      } catch (error) {
        console.error("Rol ve izinler yüklenirken hata:", error);
        toast.error(error instanceof Error ? error.message : "Rol ve izinler yüklenirken bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };
    
    loadRolesAndPermissions();
  }, []);

  // API'den gelen PermissionCategory verisini UI için dönüştür
  const transformPermissionCategories = (apiCategories: PermissionCategoryType[]): PermissionCategory[] => {
    return apiCategories.map(category => ({
      name: category.name,
      description: `${category.name} ile ilgili izinler`,
      permissions: category.permissions.map(permission => ({
        id: permission.kod,
        name: permission.ad,
        description: permission.aciklama || permission.ad,
        defaultRoles: [] // Bu bilgi artık veritabanında saklandığı için gereksiz
      }))
    }));
  };
  
  // İlk kez çalıştırılacak - veritabanında izin yoksa başlangıç izinlerini ekle
  const seedInitialPermissionsIfNeeded = async () => {
    try {
      // Önce mevcut izinleri kontrol et
      const response = await getRolesWithPermissions();
      
      // Eğer izin kategorileri boşsa veya hiç izin yoksa, varsayılan izinleri ekle
      if (!response.permissionCategories || response.permissionCategories.length === 0) {
        // Varsayılan izin yapılandırmasını oluştur
        const defaultPermissions = createDefaultPermissions();
        
        // API'ye gönder
        const seedResponse = await seedPermissions(defaultPermissions);
        
        if (seedResponse.success) {
          // İzinler eklendikten sonra sayfayı yenile
          window.location.reload();
        } else {
          toast.error(seedResponse.message || "İzin tanımları yüklenirken bir hata oluştu");
        }
      }
    } catch (error) {
      console.error("İzin tanımları yüklenirken hata:", error);
      toast.error("İzin tanımları yüklenirken bir hata oluştu");
    }
  };
  
  // Varsayılan izin yapılandırması
  const createDefaultPermissions = () => {
    return {
      permissions: {
        "Kullanıcı Yönetimi": [
          { 
            id: 'user.view', 
            name: 'Kullanıcıları Görüntüleme', 
            description: 'Sistemdeki tüm kullanıcıları görüntüleme yetkisi'
          },
          { 
            id: 'user.create', 
            name: 'Kullanıcı Oluşturma', 
            description: 'Sisteme yeni kullanıcı ekleme yetkisi'
          },
          { 
            id: 'user.edit', 
            name: 'Kullanıcı Düzenleme', 
            description: 'Mevcut kullanıcıları düzenleme yetkisi'
          },
          { 
            id: 'user.delete', 
            name: 'Kullanıcı Silme', 
            description: 'Kullanıcıları sistemden silme yetkisi'
          },
          { 
            id: 'role.manage', 
            name: 'Rol Yönetimi', 
            description: 'Rol ve izin yönetimi yapma yetkisi'
          }
        ],
        "Talep Yönetimi": [
          { 
            id: 'request.create', 
            name: 'Talep Oluşturma', 
            description: 'Yeni satınalma talebi oluşturma yetkisi'
          },
          { 
            id: 'request.view_own', 
            name: 'Kendi Taleplerini Görüntüleme', 
            description: 'Kullanıcının kendi taleplerini görüntüleme yetkisi'
          },
          { 
            id: 'request.view_all', 
            name: 'Tüm Talepleri Görüntüleme', 
            description: 'Sistemdeki tüm talepleri görüntüleme yetkisi'
          },
          { 
            id: 'request.approve', 
            name: 'Talep Onaylama', 
            description: 'Talepleri onaylama yetkisi'
          },
          { 
            id: 'request.reject', 
            name: 'Talep Reddetme', 
            description: 'Talepleri reddetme yetkisi'
          },
          { 
            id: 'request.edit', 
            name: 'Talep Düzenleme', 
            description: 'Mevcut talepleri düzenleme yetkisi'
          },
          { 
            id: 'request.delete', 
            name: 'Talep Silme', 
            description: 'Talepleri silme yetkisi'
          }
        ],
        "Satınalma Yönetimi": [
          { 
            id: 'purchase.process', 
            name: 'Satınalma Süreci', 
            description: 'Satınalma sürecini yönetme yetkisi'
          },
          { 
            id: 'purchase.approve', 
            name: 'Satınalma Onaylama', 
            description: 'Satınalma işlemlerini onaylama yetkisi'
          },
          { 
            id: 'purchase.complete', 
            name: 'Satınalma Tamamlama', 
            description: 'Satınalma işlemlerini tamamlama yetkisi'
          }
        ],
        "Ürün ve Katalog Yönetimi": [
          { 
            id: 'product.view', 
            name: 'Ürünleri Görüntüleme', 
            description: 'Ürün kataloğunu görüntüleme yetkisi'
          },
          { 
            id: 'product.manage', 
            name: 'Ürün Yönetimi', 
            description: 'Ürün ekleme, düzenleme ve silme yetkisi'
          }
        ],
        "Raporlama": [
          { 
            id: 'report.basic', 
            name: 'Temel Raporlar', 
            description: 'Temel raporları görüntüleme yetkisi'
          },
          { 
            id: 'report.advanced', 
            name: 'Gelişmiş Raporlar', 
            description: 'Gelişmiş ve özel raporları görüntüleme yetkisi'
          },
          { 
            id: 'report.export', 
            name: 'Rapor Dışa Aktarma', 
            description: 'Raporları dışa aktarma yetkisi'
          }
        ]
      }
    };
  };

  // Seçili rol için izin durumunu kontrol et
  const checkPermission = (permission: Permission, role: Role) => {
    return rolePermissions[role]?.includes(permission.id) || false;
  };

  // İzin değişikliğini işle
  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    // ADMIN rolünün bazı kritik izinlerini değiştirmesini engelleyelim
    const criticalAdminPermissions = [
      'user.view', 'user.create', 'user.edit', 'user.delete', 'role.manage',
      'system.settings', 'system.logs', 'system.backup'
    ];
    
    if (activeTab === 'ADMIN' && criticalAdminPermissions.includes(permissionId)) {
      toast.error("Admin rolünün kritik izinleri değiştirilemez!");
      return;
    }

    // İzin değişikliğini uygula
    setRolePermissions(prev => {
      const updatedPermissions = { ...prev };
      const rolePerms = [...(updatedPermissions[activeTab] || [])];
      
      if (checked) {
        // İzin yoksa ekle
        if (!rolePerms.includes(permissionId)) {
          rolePerms.push(permissionId);
        }
      } else {
        // İzin varsa kaldır
        const index = rolePerms.indexOf(permissionId);
        if (index > -1) {
          rolePerms.splice(index, 1);
        }
      }
      
      updatedPermissions[activeTab] = rolePerms;
      
      // Değişiklik olup olmadığını kontrol et
      const hasAnyChanges = !areRolePermissionsEqual(
        updatedPermissions[activeTab] || [], 
        initialRolePermissions[activeTab] || []
      );
      setHasChanges(hasAnyChanges);
      
      return updatedPermissions;
    });
  };
  
  // İki permission dizisinin eşit olup olmadığını kontrol et
  const areRolePermissionsEqual = (perms1: string[], perms2: string[]) => {
    if (perms1.length !== perms2.length) return false;
    
    // Her iki dizideki tüm değerleri sırala ve karşılaştır
    const sorted1 = [...perms1].sort();
    const sorted2 = [...perms2].sort();
    
    for (let i = 0; i < sorted1.length; i++) {
      if (sorted1[i] !== sorted2[i]) return false;
    }
    
    return true;
  };

  // Değişiklikleri kaydet
  const saveChanges = async () => {
    setLoading(true);
    try {
      // Rol izinlerini güncelle
      await updateRolePermissions(activeTab, rolePermissions[activeTab] || []);
      
      // İnitial state'i güncelle
      setInitialRolePermissions(prev => ({
        ...prev,
        [activeTab]: [...(rolePermissions[activeTab] || [])]
      }));
      
      toast.success(`${getRoleName(activeTab)} rolünün izinleri başarıyla güncellendi.`);
      setHasChanges(false);
    } catch (error) {
      console.error("İzinler güncellenirken hata:", error);
      toast.error("İzinler güncellenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // Rol adını getir
  const getRoleName = (roleId: Role): string => {
    return roles.find(r => r.id === roleId)?.name || roleId;
  };

  // Rol ekle
  const handleAddRole = async (roleData: { id: string; name: string }) => {
    try {
      const response = await createRole(roleData);
      if (response.success) {
        // Rolleri yeniden yükle
        const rolesResponse = await getRolesWithPermissions();
        if (rolesResponse && rolesResponse.roles) {
          setRoles(rolesResponse.roles.map(role => ({
            id: role.id as Role,
            name: role.name
          })));
        }
        toast.success('Rol başarıyla eklendi');
      } else {
        toast.error(response.message || 'Rol eklenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Rol ekleme hatası:', error);
      toast.error('Rol eklenirken bir hata oluştu');
    }
  };

  // Rol güncelle
  const handleUpdateRole = async (roleData: { id: string; name: string }) => {
    try {
      const response = await updateRole(roleData);
      if (response.success) {
        // Rolleri yeniden yükle
        const rolesResponse = await getRolesWithPermissions();
        if (rolesResponse && rolesResponse.roles) {
          setRoles(rolesResponse.roles.map(role => ({
            id: role.id as Role,
            name: role.name
          })));
        }
        toast.success('Rol başarıyla güncellendi');
      } else {
        toast.error(response.message || 'Rol güncellenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Rol güncelleme hatası:', error);
      toast.error('Rol güncellenirken bir hata oluştu');
    }
  };

  // Rol sil
  const handleDeleteRole = async (roleId: string) => {
    try {
      const response = await deleteRole(roleId);
      if (response.success) {
        // Rolleri yeniden yükle
        const rolesResponse = await getRolesWithPermissions();
        if (rolesResponse && rolesResponse.roles) {
          setRoles(rolesResponse.roles.map(role => ({
            id: role.id as Role,
            name: role.name
          })));
        }
        toast.success('Rol başarıyla silindi');
      } else {
        toast.error(response.message || 'Rol silinirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Rol silme hatası:', error);
      toast.error('Rol silinirken bir hata oluştu');
    }
  };

  // Veriler yüklenene kadar yükleniyor durumu göster
  if (!initialDataLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <RefreshCw className="h-8 w-8 animate-spin mb-4" />
          <p>Rol ve izin verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rol ve İzin Matrisi</CardTitle>
          <CardDescription>
            Sistem rollerinin izinlerini görüntüleyin ve düzenleyin. Değişikliklerinizi kaydetmek için "Değişiklikleri Kaydet" butonuna tıklayın.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {roles.length > 0 ? (
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as Role)}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 md:grid-cols-6">
                {roles.map((role) => (
                  <TabsTrigger key={role.id} value={role.id}>
                    {role.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <div className="mt-4 flex justify-end">
                <Button 
                  onClick={saveChanges} 
                  disabled={loading || !hasChanges}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Değişiklikleri Kaydet
                    </>
                  )}
                </Button>
              </div>
              
              <ScrollArea className="h-[500px] mt-4 border rounded-md">
                <div className="p-4">
                  {permissionCategories.map((category) => (
                    <div key={category.name} className="mb-8">
                      <h3 className="text-lg font-medium mb-2">{category.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                      
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[300px]">İzin</TableHead>
                            <TableHead className="w-[400px]">Açıklama</TableHead>
                            <TableHead className="w-[100px] text-center">İzin Durumu</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {category.permissions.map((permission) => (
                            <TableRow key={permission.id}>
                              <TableCell className="font-medium">{permission.name}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  {permission.description}
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="h-4 w-4 ml-2 text-muted-foreground cursor-pointer" />
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-sm">
                                        <p>{permission.description}</p>
                                        <p className="text-xs mt-1">İzin kodu: {permission.id}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex justify-center">
                                  <Checkbox
                                    checked={checkPermission(permission, activeTab)}
                                    onCheckedChange={(checked) => 
                                      handlePermissionChange(
                                        permission.id, 
                                        !!checked
                                      )
                                    }
                                    disabled={
                                      // Admin rolünün kritik izinlerini değiştirmeye izin verme
                                      activeTab === 'ADMIN' && 
                                      [
                                        'user.view', 'user.create', 'user.edit', 'user.delete', 
                                        'role.manage', 'system.settings', 'system.logs', 'system.backup'
                                      ].includes(permission.id)
                                    }
                                  />
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Tabs>
          ) : (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Roller yüklenemedi veya tanımlı rol bulunamadı.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roller Hakkında</CardTitle>
          <CardDescription>
            Sistem rolleri ve her rolün erişim seviyeleri hakkında bilgiler.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <Card key={role.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{role.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {getDescriptionForRole(role.id)}
                  </p>
                  <p className="text-xs mt-2 text-muted-foreground">
                    İzin sayısı: {rolePermissions[role.id]?.length || 0}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Role açıklamaları
function getDescriptionForRole(roleId: string): string {
  switch (roleId) {
    case 'ADMIN':
      return 'Tam sistem erişimi olan yönetici rolü. Tüm sistem ayarlarını değiştirebilir ve tüm işlevlere erişebilir.';
    case 'IT_ADMIN':
      return 'IT departmanı işlemlerini yönetmek için gerekli yetkilere sahip rol. Talepleri değerlendirir ve IT süreçlerini yönetir.';
    case 'FINANS_ADMIN':
      return 'Finansal onayları yönetir ve bütçe kontrolü sağlar. Raporlama ve finans süreçlerine erişimi vardır.';
    case 'SATINALMA_ADMIN':
      return 'Satınalma süreçlerini yönetir. Onaylanmış taleplerin satınalma işlemlerini gerçekleştirir.';
    case 'DEPARTMAN_YONETICISI':
      return 'Departman taleplerini onaylar ve departman çalışanlarının taleplerini yönetir.';
    case 'KULLANICI':
      return 'Temel kullanıcı erişimi. Talep oluşturabilir ve kendi taleplerini takip edebilir.';
    default:
      return 'Bu rol için açıklama bulunmuyor.';
  }
} 