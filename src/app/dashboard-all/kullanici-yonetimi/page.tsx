import { Metadata } from "next";
import { KullaniciYonetimiWrapper } from "@/components/kullanicilar/kullanici-yonetimi-wrapper";

export const metadata: Metadata = {
  title: "Kullanıcı Yönetimi | IT Satınalma Sistemi",
  description: "Kullanıcıları yönetin, yeni kullanıcılar ekleyin ve rolleri düzenleyin.",
};

export default function KullaniciYonetimiPage() {
  return <KullaniciYonetimiWrapper />;
}