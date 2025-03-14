"use client";

import { CalendarIcon, EyeIcon, FilterIcon, SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { TalepDetayDialog } from "@/components/talepler/talep-detay-dialog"
import { TalepFiltrelemeWrapper } from "@/components/talepler/talep-filtreleme-wrapper"

// Örnek veri yapısı
const taleplerData = [
  {
    id: "TAL-2023-001",
    baslik: "Yazılım Geliştirme Ekibi için MacBook Pro",
    departman: "Yazılım Geliştirme",
    talep_eden: "Ahmet Yılmaz",
    tarih: "2023-05-15",
    durum: "Onay Bekliyor",
    oncelik: "Yüksek",
    tahmini_fiyat: "25.000 TL"
  },
  {
    id: "TAL-2023-002",
    baslik: "Toplantı Odası Projektör",
    departman: "İnsan Kaynakları",
    talep_eden: "Ayşe Demir",
    tarih: "2023-05-14",
    durum: "Onaylandı",
    oncelik: "Orta",
    tahmini_fiyat: "15.000 TL"
  },
  {
    id: "TAL-2023-003",
    baslik: "Microsoft Office Lisansları (10 Kullanıcı)",
    departman: "Finans",
    talep_eden: "Mehmet Kaya",
    tarih: "2023-05-12",
    durum: "Tamamlandı",
    oncelik: "Düşük",
    tahmini_fiyat: "8.000 TL"
  },
  {
    id: "TAL-2023-004",
    baslik: "Grafik Tasarım Ekibi için Wacom Tabletler",
    departman: "Pazarlama",
    talep_eden: "Zeynep Aydın",
    tarih: "2023-05-10",
    durum: "Reddedildi",
    oncelik: "Yüksek",
    tahmini_fiyat: "12.000 TL"
  },
  {
    id: "TAL-2023-005",
    baslik: "Sunucu Donanım Yükseltmesi",
    departman: "IT",
    talep_eden: "Burak Öztürk",
    tarih: "2023-05-08",
    durum: "Satınalma Sürecinde",
    oncelik: "Kritik",
    tahmini_fiyat: "50.000 TL"
  },
]

// Durum badge'inin rengini belirleyen fonksiyon
function getDurumBadgeVariant(durum: string) {
  switch (durum) {
    case "Onay Bekliyor":
      return "outline"
    case "Onaylandı":
      return "secondary"
    case "Tamamlandı":
      return "success"
    case "Reddedildi":
      return "destructive"
    case "Satınalma Sürecinde":
      return "default"
    default:
      return "outline"
  }
}

// Client Component'i (sunucu tarafında render edilen sayfa içinde kullanacağız)
import { TalepFiltrele, TalepFiltresi } from "@/components/talepler/talep-filtrele"

export default function TaleplerPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Talepler</h1>
        <Button asChild>
          <a href="/talep-olustur">
            Yeni Talep Oluştur
          </a>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Tüm Talepler</CardTitle>
          <CardDescription>
            Sistemde kayıtlı tüm IT satınalma taleplerini görüntüleyin ve yönetin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Filtreleme ve tablo bileşeni - Client Component */}
            <TalepFiltrelemeWrapper />
          </div>
        </CardContent>
      </Card>
      
      {/* Not: Bu kısım gerçek uygulamada bir client component içinde olacaktır */}
      {/* <TalepDetayDialog
        talep={seciliTalep}
        open={detayDialogAcik}
        onOpenChange={setDetayDialogAcik}
      /> */}
    </div>
  )
} 