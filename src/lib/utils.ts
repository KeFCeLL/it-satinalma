import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Tarihi formatlar ve Türkçe olarak gösterir
 * @param dateString - Tarih string'i veya Date nesnesi
 * @param options - Intl.DateTimeFormat options
 * @returns Formatlanmış tarih string'i
 */
export function formatDate(
  dateString: string | Date,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }
): string {
  if (!dateString) return "—";
  
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  
  // Geçersiz tarih kontrolü
  if (isNaN(date.getTime())) return "Geçersiz Tarih";
  
  return new Intl.DateTimeFormat("tr-TR", options).format(date);
}
