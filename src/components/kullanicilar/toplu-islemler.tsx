"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search, UserCheck, KeyRound, Shield } from "lucide-react";

// Mock data
interface User {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  departman: string;
  rol: string;
  selected?: boolean;
}

export function TopluIslemler() {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("reset-password");
  const [selectAll, setSelectAll] = useState(false);
  const [users, setUsers] = useState<User[]>([
    { id: "1", ad: "Ahmet", soyad: "Yılmaz", email: "ahmet.yilmaz@sirket.com", departman: "IT", rol: "IT_ADMIN" },
    { id: "2", ad: "Mehmet", soyad: "Kaya", email: "mehmet.kaya@sirket.com", departman: "Finans", rol: "FINANS_ADMIN" },
    { id: "3", ad: "Ayşe", soyad: "Demir", email: "ayse.demir@sirket.com", departman: "Satınalma", rol: "SATINALMA_ADMIN" },
    { id: "4", ad: "Fatma", soyad: "Çelik", email: "fatma.celik@sirket.com", departman: "İnsan Kaynakları", rol: "DEPARTMAN_YONETICISI" },
    { id: "5", ad: "Ali", soyad: "Şahin", email: "ali.sahin@sirket.com", departman: "Pazarlama", rol: "KULLANICI" },
    { id: "6", ad: "Zeynep", soyad: "Öztürk", email: "zeynep.ozturk@sirket.com", departman: "Yönetim", rol: "ADMIN" },
  ]);
  const [selectedRole, setSelectedRole] = useState("");
  const [passwordLength, setPasswordLength] = useState(10);
  const [includeSpecialChars, setIncludeSpecialChars] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeUppercase, setIncludeUppercase] = useState(true);

  // Filtrelenmiş kullanıcılar
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.ad.toLowerCase().includes(searchLower) ||
      user.soyad.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.departman.toLowerCase().includes(searchLower) ||
      user.rol.toLowerCase().includes(searchLower)
    );
  });

  // Seçili kullanıcıları al
  const getSelectedUsers = () => {
    return users.filter(user => user.selected);
  };

  // Tümünü seç/kaldır
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setUsers(users.map(user => ({ ...user, selected: checked })));
  };

  // Tek kullanıcı seçimi
  const handleSelectUser = (userId: string, checked: boolean) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, selected: checked } : user
    ));
    
    // Tümü seçili mi kontrol et
    const allSelected = users.every(user => 
      user.id === userId ? checked : (user.selected || false)
    );
    setSelectAll(allSelected);
  };

  // Şifre sıfırlama işlemi
  const handleResetPasswords = async () => {
    const selectedUsers = getSelectedUsers();
    if (selectedUsers.length === 0) {
      toast.error("Lütfen en az bir kullanıcı seçin.");
      return;
    }

    setLoading(true);
    try {
      // API isteği simülasyonu
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Şifre seçenekleri
      const passwordOptions = {
        length: passwordLength,
        includeSpecialChars,
        includeNumbers,
        includeUppercase
      };
      
      toast.success(`${selectedUsers.length} kullanıcının şifresi başarıyla sıfırlandı ve e-posta ile bildirildi.`);
      
      // Seçimleri temizle
      setUsers(users.map(user => ({ ...user, selected: false })));
      setSelectAll(false);
    } catch (error) {
      toast.error("Şifre sıfırlama işlemi sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // Rol atama işlemi
  const handleAssignRole = async () => {
    const selectedUsers = getSelectedUsers();
    if (selectedUsers.length === 0) {
      toast.error("Lütfen en az bir kullanıcı seçin.");
      return;
    }

    if (!selectedRole) {
      toast.error("Lütfen atamak istediğiniz rolü seçin.");
      return;
    }

    setLoading(true);
    try {
      // API isteği simülasyonu
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Rolleri güncelle (UI için)
      setUsers(users.map(user => 
        user.selected ? { ...user, rol: selectedRole, selected: false } : user
      ));
      
      toast.success(`${selectedUsers.length} kullanıcıya "${selectedRole}" rolü başarıyla atandı.`);
      
      // Seçimleri temizle
      setSelectAll(false);
    } catch (error) {
      toast.error("Rol atama işlemi sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Toplu İşlemler</CardTitle>
          <CardDescription>
            Birden fazla kullanıcı için şifre sıfırlama veya rol atama işlemleri gerçekleştirin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="reset-password">
                <KeyRound className="mr-2 h-4 w-4" />
                Şifre Sıfırlama
              </TabsTrigger>
              <TabsTrigger value="role-assignment">
                <Shield className="mr-2 h-4 w-4" />
                Rol Atama
              </TabsTrigger>
            </TabsList>

            {/* Arama */}
            <div className="flex items-center mt-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Kullanıcı ara..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Kullanıcı listesi */}
            <div className="border rounded-md">
              <ScrollArea className="h-[400px]">
                <table className="w-full">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="p-2 text-left font-medium">
                        <Checkbox
                          checked={selectAll}
                          onCheckedChange={(checked) => handleSelectAll(!!checked)}
                        />
                      </th>
                      <th className="p-2 text-left font-medium">Ad</th>
                      <th className="p-2 text-left font-medium">Soyad</th>
                      <th className="p-2 text-left font-medium">E-posta</th>
                      <th className="p-2 text-left font-medium">Departman</th>
                      <th className="p-2 text-left font-medium">Rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="border-t hover:bg-muted/50">
                          <td className="p-2">
                            <Checkbox
                              checked={user.selected || false}
                              onCheckedChange={(checked) => handleSelectUser(user.id, !!checked)}
                            />
                          </td>
                          <td className="p-2">{user.ad}</td>
                          <td className="p-2">{user.soyad}</td>
                          <td className="p-2">{user.email}</td>
                          <td className="p-2">{user.departman}</td>
                          <td className="p-2">{user.rol}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center p-4 text-muted-foreground">
                          Sonuç bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </ScrollArea>
            </div>

            {/* İşlem seçenekleri */}
            <TabsContent value="reset-password" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Şifre Sıfırlama Seçenekleri</CardTitle>
                  <CardDescription>
                    Sıfırlanan şifreler seçilen kurallara göre oluşturulacak ve kullanıcılara e-posta ile gönderilecektir.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password-length">Şifre Uzunluğu</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="password-length"
                          type="number"
                          min={8}
                          max={24}
                          value={passwordLength}
                          onChange={(e) => setPasswordLength(Number(e.target.value))}
                        />
                        <span className="text-sm text-muted-foreground">karakter</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Şifre İçeriği</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="special-chars"
                          checked={includeSpecialChars}
                          onCheckedChange={(checked) => setIncludeSpecialChars(!!checked)}
                        />
                        <Label htmlFor="special-chars">Özel karakterler</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="numbers"
                          checked={includeNumbers}
                          onCheckedChange={(checked) => setIncludeNumbers(!!checked)}
                        />
                        <Label htmlFor="numbers">Sayılar</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="uppercase"
                          checked={includeUppercase}
                          onCheckedChange={(checked) => setIncludeUppercase(!!checked)}
                        />
                        <Label htmlFor="uppercase">Büyük harfler</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleResetPasswords} disabled={loading}>
                    {loading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        İşlem yapılıyor...
                      </>
                    ) : (
                      <>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Seçili Kullanıcıların Şifrelerini Sıfırla
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="role-assignment" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Rol Atama Seçenekleri</CardTitle>
                  <CardDescription>
                    Seçilen kullanıcılara aşağıdaki rolü atayın.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="role-select">Atanacak Rol</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger id="role-select">
                        <SelectValue placeholder="Rol seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Kullanıcı Rolleri</SelectLabel>
                          <SelectItem value="ADMIN">Sistem Yöneticisi</SelectItem>
                          <SelectItem value="IT_ADMIN">IT Yöneticisi</SelectItem>
                          <SelectItem value="FINANS_ADMIN">Finans Yöneticisi</SelectItem>
                          <SelectItem value="SATINALMA_ADMIN">Satınalma Yöneticisi</SelectItem>
                          <SelectItem value="DEPARTMAN_YONETICISI">Departman Yöneticisi</SelectItem>
                          <SelectItem value="KULLANICI">Standart Kullanıcı</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleAssignRole} disabled={loading || !selectedRole}>
                    {loading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        İşlem yapılıyor...
                      </>
                    ) : (
                      <>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Seçili Kullanıcılara Rol Ata
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 