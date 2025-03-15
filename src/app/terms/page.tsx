import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Kullanım Şartları | IT Satınalma Yönetimi",
  description: "IT Satınalma Yönetimi Sistemi Kullanım Şartları",
};

export default function TermsPage() {
  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Kullanım Şartları</h1>
      
      <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
        <p className="mb-4">
          Green Chemicals IT Satınalma Yönetim Sistemine hoş geldiniz. Bu web uygulamasını ("Uygulama") kullanarak, 
          aşağıdaki kullanım şartlarını kabul etmiş olursunuz.
        </p>
        
        <h2 className="text-xl font-bold mt-6 mb-4">1. Erişim ve Kullanım</h2>
        <p className="mb-4">
          Bu uygulama, Green Chemicals şirketinin özel kullanımı için tasarlanmıştır.
          Uygulamaya erişim sağlama hakkı, yönetim tarafından yetkilendirilmiş kişilerle sınırlıdır.
          Yetkisiz erişim ve kullanım yasaktır.
        </p>
        
        <h2 className="text-xl font-bold mt-6 mb-4">2. Hesap Güvenliği</h2>
        <p className="mb-4">
          Kullanıcılar kendi hesaplarının güvenliğinden sorumludur. Güçlü şifreler kullanılmalı ve 
          şifreler düzenli olarak değiştirilmelidir. Hesabınızla ilgili herhangi bir şüpheli aktivite
          fark ettiğinizde, lütfen IT departmanını bilgilendirin.
        </p>
        
        <h2 className="text-xl font-bold mt-6 mb-4">3. Gizlilik</h2>
        <p className="mb-4">
          Uygulama üzerinde işlenen tüm veriler şirket gizlilik politikasına tabidir.
          Uygulama aracılığıyla erişilen bilgilerin gizliliğini korumak kullanıcının sorumluluğundadır.
        </p>
        
        <h2 className="text-xl font-bold mt-6 mb-4">4. Fikri Mülkiyet</h2>
        <p className="mb-4">
          Bu uygulamadaki tüm içerik ve yazılım, Green Chemicals şirketinin fikri mülkiyetidir.
          İçeriğin çoğaltılması, dağıtılması veya değiştirilmesi, açık yazılı izin olmadan yasaktır.
        </p>
        
        <h2 className="text-xl font-bold mt-6 mb-4">5. Sorumluluk Reddi</h2>
        <p className="mb-4">
          Uygulama "olduğu gibi" sağlanmaktadır, herhangi bir garanti olmaksızın.
          Green Chemicals, uygulamanın kesintisiz çalışması, hatasız olması veya belirli ihtiyaçları 
          karşılaması konusunda herhangi bir garanti vermez.
        </p>
        
        <div className="mt-8 mb-4">
          <Link href="/auth/login">
            <Button variant="outline">Login Sayfasına Dön</Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 