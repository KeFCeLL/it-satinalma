import { Metadata } from "next";
import { TalepForm } from "@/components/forms/talep-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Talep Oluştur | IT Satınalma Yönetimi",
  description: "IT Satınalma Süreç Yönetimi - Yeni Talep Oluşturma",
};

export default function TalepOlusturPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Talep Oluştur</h2>
        <p className="text-muted-foreground">
          Yeni bir IT ürün veya hizmet talebi oluşturun. Talepleriniz önce IT departmanı, sonra Finans ve son olarak Satınalma departmanları tarafından değerlendirilecektir.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Yeni Talep</CardTitle>
          <CardDescription>
            Lütfen talep ettiğiniz ürün veya hizmet ile ilgili tüm bilgileri eksiksiz doldurun.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TalepForm />
        </CardContent>
      </Card>
    </div>
  );
} 