import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profil Ayarları | IT Satınalma Yönetimi",
  description: "Kişisel bilgilerinizi görüntüleyin ve düzenleyin",
};

export default function ProfilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 