import { fetchWithAuth, handleApiResponse } from "../api";

export type Role = {
  id: string;
  name: string;
  permissions: string[];
};

export type Permission = {
  id: string;
  kod: string;
  ad: string;
  aciklama?: string;
  kategori: string;
};

export type PermissionCategory = {
  name: string;
  permissions: Permission[];
};

export type RolePermissionsResponse = {
  roles: Role[];
  permissionCategories: PermissionCategory[];
};

// Tüm rolleri ve izinleri getir
export async function getRolesWithPermissions(): Promise<RolePermissionsResponse> {
  const response = await fetchWithAuth('/api/roller');
  return handleApiResponse(response);
}

// Rol izinlerini güncelle
export async function updateRolePermissions(roleId: string, permissions: string[]): Promise<{ success: boolean; message: string }> {
  const response = await fetchWithAuth('/api/roller', {
    method: 'PUT',
    body: JSON.stringify({ roleId, permissions }),
  });
  return handleApiResponse(response);
}

// İzin tanımlarını yükle (sadece admin için)
export async function seedPermissions(permissionData: any): Promise<{ success: boolean; message: string }> {
  const response = await fetchWithAuth('/api/roller', {
    method: 'POST',
    body: JSON.stringify(permissionData),
  });
  return handleApiResponse(response);
} 