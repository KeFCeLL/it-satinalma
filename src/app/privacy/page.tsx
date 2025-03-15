import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Gizlilik Politikası | IT Satınalma Yönetimi",
  description: "IT Satınalma Yönetimi Sistemi Gizlilik Politikası",
};

export default function PrivacyPage() {
  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Gizlilik Politikası</h1>
      
      <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
        <p className="mb-4">
          Green Chemicals olarak veri gizliliğinize saygı duyuyor ve korumayı taahhüt ediyoruz.
          Bu gizlilik politikası, IT Satınalma Yönetim Sistemi'nde topladığımız verilerin nasıl işlendiğini açıklar.
        </p>
        
        <h2 className="text-xl font-bold mt-6 mb-4">1. Toplanan Bilgiler</h2>
        <p className="mb-4">
          Sistemimiz, şu kişisel bilgileri toplayabilir:
        </p>
        <ul className="list-disc ml-8 mb-4">
          <li>Ad ve soyadı</li>
          <li>İş e-posta adresi</li>
          <li>Departman bilgisi</li>
          <li>Kullanıcı rolü ve yetkileri</li>
          <li>Oluşturduğunuz talep ve işlem kayıtları</li>
        </ul>
        
        <h2 className="text-xl font-bold mt-6 mb-4">2. Bilgilerin Kullanımı</h2>
        <p className="mb-4">
          Toplanan bilgiler şu amaçlarla kullanılır:
        </p>
        <ul className="list-disc ml-8 mb-4">
          <li>IT satınalma süreçlerinin yönetimi</li>
          <li>Kullanıcı kimlik doğrulama ve yetkilendirme</li>
          <li>Taleplerinizin durumunu takip etme ve bilgilendirme</li>
          <li>Sistem performansının ve güvenliğinin sağlanması</li>
        </ul>
        
        <h2 className="text-xl font-bold mt-6 mb-4">3. Bilgi Güvenliği</h2>
        <p className="mb-4">
          Kişisel bilgilerinizin güvenliğini sağlamak için çeşitli teknik ve idari önlemler alıyoruz.
          Verileriniz şifreli iletişim protokolleri kullanılarak iletilir ve güvenli sunucularda saklanır.
        </p>
        
        <h2 className="text-xl font-bold mt-6 mb-4">4. Çerezler ve Kullanım Verileri</h2>
        <p className="mb-4">
          Uygulamamız, oturum yönetimi ve güvenlik amacıyla çerezler kullanır.
          Ayrıca, hizmet kalitesini artırmak için kullanım istatistikleri toplanabilir.
        </p>
        
        <h2 className="text-xl font-bold mt-6 mb-4">5. Veri Saklama ve Silme</h2>
        <p className="mb-4">
          Kişisel verileriniz, hesabınız aktif olduğu sürece ve yasal saklama süreleri boyunca sistemimizde tutulur.
          İş akışlarının takibi ve denetim amacıyla, işlem kayıtları belirlenen saklama süreleri boyunca korunur.
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