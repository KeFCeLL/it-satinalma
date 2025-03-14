import { fetchWithAuth, handleApiResponse, PaginatedResponse, PaginationParams, addQueryParams } from "../api";
import { User } from "./user-service";

export type Notification = {
  id: string;
  kullaniciId: string;
  kullanici?: User;
  baslik: string;
  icerik: string;
  okundu: boolean;
  link?: string;
  createdAt: string;
  updatedAt: string;
};

// Bildirimleri getir
export async function getNotifications(params?: PaginationParams & {
  okundu?: boolean;
}): Promise<PaginatedResponse<Notification> & { okunmamisSayisi: number }> {
  const url = addQueryParams('/api/bildirimler', params || {});
  const response = await fetchWithAuth(url);
  return handleApiResponse(response);
}

// Tek bir bildirimi getir
export async function getNotification(id: string): Promise<{ bildirim: Notification }> {
  const response = await fetchWithAuth(`/api/bildirimler/${id}`);
  return handleApiResponse(response);
}

// Bildirimi okundu olarak işaretle
export async function markNotificationAsRead(id: string): Promise<{ bildirim: Notification }> {
  const response = await fetchWithAuth(`/api/bildirimler/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ okundu: true }),
  });
  return handleApiResponse(response);
}

// Bildirimi sil
export async function deleteNotification(id: string): Promise<{ success: boolean }> {
  const response = await fetchWithAuth(`/api/bildirimler/${id}`, {
    method: 'DELETE',
  });
  return handleApiResponse(response);
}

// Tüm bildirimleri okundu olarak işaretle
export async function markAllNotificationsAsRead(): Promise<{ success: boolean }> {
  const response = await fetchWithAuth('/api/bildirimler', {
    method: 'PUT',
  });
  return handleApiResponse(response);
} 