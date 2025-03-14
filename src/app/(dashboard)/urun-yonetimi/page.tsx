import { Metadata } from "next";
import { UrunYonetimiWrapper } from "@/components/urunler/urun-yonetimi-wrapper";

export const metadata: Metadata = {
  title: "Ürün Yönetimi | IT Satınalma Yönetimi",
  description: "IT Satınalma Süreç Yönetimi Sistemi Ürün Yönetimi",
};

export default function UrunYonetimiPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Ürün Yönetimi</h2>
      </div>
      
      <div className="container mx-auto py-4">
        <UrunYonetimiWrapper />
      </div>
    </div>
  );
} 