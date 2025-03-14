import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CalendarIcon, CheckIcon, ClockIcon, DollarSignIcon, FileTextIcon, UserIcon, XIcon } from "lucide-react"

interface TalepDetayDialogProps {
  talep: any // Gerçek uygulamada burada daha spesifik bir tip kullanılacak
  open: boolean
  onOpenChange: (open: boolean) => void
}

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

export function TalepDetayDialog({ talep, open, onOpenChange }: TalepDetayDialogProps) {
  if (!talep) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Talep Detayları - {talep.id}</DialogTitle>
          <DialogDescription>
            {talep.baslik}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex justify-between items-center pb-4">
            <Badge variant={getDurumBadgeVariant(talep.durum) as any}>
              {talep.durum}
            </Badge>
            <Badge variant="outline" className="ml-2">{talep.oncelik} Öncelik</Badge>
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-4">
            <div className="flex flex-col space-y-1">
              <h4 className="text-sm font-medium">Talep Detayları</h4>
              <p className="text-sm text-gray-500">{talep.baslik}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Talep Eden</p>
                  <p className="text-sm font-medium">{talep.talep_eden}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Departman</p>
                  <p className="text-sm font-medium">{talep.departman}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Talep Tarihi</p>
                  <p className="text-sm font-medium">{talep.tarih}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Tahmini Fiyat</p>
                  <p className="text-sm font-medium">{talep.tahmini_fiyat}</p>
                </div>
              </div>
            </div>
            
            <Separator className="my-2" />
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Açıklama</h4>
              <p className="text-sm text-gray-500">
                Bu talep, {talep.departman} departmanı için gerekli olan {talep.baslik} 
                ürününün satın alınması için oluşturulmuştur. Ürün, departmanın verimliliğini 
                artırmak ve mevcut iş süreçlerini iyileştirmek için gereklidir.
              </p>
            </div>
            
            <Separator className="my-2" />
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Onay Süreci</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckIcon className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Departman Yöneticisi Onayı</span>
                  </div>
                  <span className="text-xs text-gray-500">15.05.2023 14:30</span>
                </div>
                
                {talep.durum === "Onay Bekliyor" ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="h-4 w-4 text-amber-500" />
                      <span className="text-sm">IT Departmanı Onayı</span>
                    </div>
                    <span className="text-xs text-gray-500">Bekliyor</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckIcon className="h-4 w-4 text-green-500" />
                      <span className="text-sm">IT Departmanı Onayı</span>
                    </div>
                    <span className="text-xs text-gray-500">16.05.2023 09:15</span>
                  </div>
                )}
                
                {talep.durum === "Onay Bekliyor" || talep.durum === "Onaylandı" ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="h-4 w-4 text-amber-500" />
                      <span className="text-sm">Finans Departmanı Onayı</span>
                    </div>
                    <span className="text-xs text-gray-500">Bekliyor</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckIcon className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Finans Departmanı Onayı</span>
                    </div>
                    <span className="text-xs text-gray-500">17.05.2023 11:40</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="space-x-2">
          {talep.durum === "Onay Bekliyor" && (
            <>
              <Button variant="destructive" size="sm">
                <XIcon className="mr-2 h-4 w-4" />
                Reddet
              </Button>
              <Button variant="default" size="sm">
                <CheckIcon className="mr-2 h-4 w-4" />
                Onayla
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 