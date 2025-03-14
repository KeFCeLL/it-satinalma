import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bekleyen Onaylar | IT Satınalma Yönetimi",
  description: "Onayınızı bekleyen talepler ve işlemleri görüntüleyin ve yönetin",
};

export default function BekleyenlerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 