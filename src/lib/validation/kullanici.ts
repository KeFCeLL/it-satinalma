import { z } from "zod";

// Rol tipi
export type Rol = "ADMIN" | "MANAGER" | "USER";

// Kullanıcı oluşturma şeması
export const kullaniciSchema = z.object({
  email: z.string().email({ message: "Geçerli bir e-posta adresi girin" }),
  ad: z.string().min(2, { message: "Ad en az 2 karakter olmalıdır" }),
  soyad: z.string().min(2, { message: "Soyad en az 2 karakter olmalıdır" }),
  rol: z.enum(["ADMIN", "MANAGER", "USER"], {
    message: "Geçerli bir rol seçin: ADMIN, MANAGER veya USER",
  }),
  departmanId: z.string().nullable().optional(),
  // Şifre kullanıcı oluşturulurken zorunlu, güncellenirken opsiyonel
  password: z.string().min(6, { message: "Şifre en az 6 karakter olmalıdır" }).optional(),
});

// Kullanıcı güncelleme şeması
export const kullaniciGuncellemeSchema = kullaniciSchema.extend({
  id: z.string().min(1, { message: "Kullanıcı ID alanı zorunludur" }),
  password: z.string().min(6, { message: "Şifre en az 6 karakter olmalıdır" }).optional(),
  status: z.enum(["AKTIF", "PASIF"], { message: "Geçerli bir durum seçin: AKTIF veya PASIF" }).optional(),
}); 