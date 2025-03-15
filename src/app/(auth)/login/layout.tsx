import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Giriş | Green Chemicals IT Satınalma Yönetimi",
  description: "Green Chemicals IT Satınalma Süreç Yönetimi Sistemi Giriş Sayfası",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}