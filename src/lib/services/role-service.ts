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

// Rol ekle
export async function createRole(roleData: { id: string; name: string }): Promise<{ success: boolean; message: string; role?: Role }> {
  const response = await fetchWithAuth('/api/roller', {
    method: 'POST',
    body: JSON.stringify(roleData),
  });
  return handleApiResponse(response);
}

// Rol güncelle
export async function updateRole(roleData: { id: string; name: string }): Promise<{ success: boolean; message: string; role?: Role }> {
  const response = await fetchWithAuth('/api/roller', {
    method: 'PUT',
    body: JSON.stringify(roleData),
  });
  return handleApiResponse(response);
}

// Rol sil
export async function deleteRole(roleId: string): Promise<{ success: boolean; message: string }> {
  const response = await fetchWithAuth('/api/roller', {
    method: 'DELETE',
    body: JSON.stringify({ id: roleId }),
  });
  return handleApiResponse(response);
}

// Rol izinlerini güncelle
export async function updateRolePermissions(roleId: string, permissions: string[]): Promise<{ success: boolean; message: string }> {
  const response = await fetchWithAuth('/api/roller/permissions', {
    method: 'PUT',
    body: JSON.stringify({ roleId, permissions }),
  });
  return handleApiResponse(response);
}

// İzin tanımlarını yükle (seed)
export async function seedPermissions(permissionData: any): Promise<{ success: boolean; message: string }> {
  const response = await fetchWithAuth('/api/roller/seed', {
    method: 'POST',
    body: JSON.stringify(permissionData),
  });
  return handleApiResponse(response);
} 