"use client"

import { useState } from "react"
import { TalepFiltrele, TalepFiltresi } from "./talep-filtrele"

interface TalepFiltrelemeProps {
  taleplerData: any[]
}

export function TalepFiltreleme({ taleplerData }: TalepFiltrelemeProps) {
  const [filtrelenmisVeriler, setFiltrelenmisVeriler] = useState(taleplerData)
  
  const handleFilterChange = (filters: TalepFiltresi) => {
    // Filtreleme işlemleri
    let sonuclar = [...taleplerData]
    
    // Arama filtresi
    if (filters.arama) {
      const searchTerm = filters.arama.toLowerCase()
      sonuclar = sonuclar.filter(
        (talep) => 
          talep.baslik.toLowerCase().includes(searchTerm) ||
          talep.id.toLowerCase().includes(searchTerm) ||
          talep.departman.toLowerCase().includes(searchTerm) ||
          talep.talep_eden.toLowerCase().includes(searchTerm)
      )
    }
    
    // Durum filtresi
    if (filters.durum !== "all") {
      const durumMap: Record<string, string> = {
        "onay-bekliyor": "Onay Bekliyor",
        "onaylandi": "Onaylandı",
        "tamamlandi": "Tamamlandı",
        "reddedildi": "Reddedildi",
        "satinalma": "Satınalma Sürecinde",
      }
      
      sonuclar = sonuclar.filter(
        (talep) => talep.durum === durumMap[filters.durum]
      )
    }
    
    // Departman filtresi
    if (filters.departman !== "all") {
      const departmanMap: Record<string, string> = {
        "yazilim": "Yazılım Geliştirme",
        "pazarlama": "Pazarlama",
        "finans": "Finans",
        "ik": "İnsan Kaynakları",
        "it": "IT",
      }
      
      sonuclar = sonuclar.filter(
        (talep) => talep.departman === departmanMap[filters.departman]
      )
    }
    
    // Tarih filtresi
    if (filters.tarihBaslangic) {
      const startDate = new Date(filters.tarihBaslangic)
      startDate.setHours(0, 0, 0, 0)
      
      sonuclar = sonuclar.filter((talep) => {
        const talepDate = new Date(talep.createdAt || talep.tarih)
        return talepDate >= startDate
      })
      
      if (filters.tarihBitis) {
        const endDate = new Date(filters.tarihBitis)
        endDate.setHours(23, 59, 59, 999)
        
        sonuclar = sonuclar.filter((talep) => {
          const talepDate = new Date(talep.createdAt || talep.tarih)
          return talepDate <= endDate
        })
      }
    }
    
    setFiltrelenmisVeriler(sonuclar)
  }
  
  return (
    <>
      <TalepFiltrele onFilterChange={handleFilterChange} />
      
      {/* Filtreleme sonucunda hiç sonuç yoksa bilgi mesajı göster */}
      {filtrelenmisVeriler.length === 0 && (
        <div className="py-6 text-center text-muted-foreground">
          Arama kriterlerinize uygun talep bulunamadı.
        </div>
      )}
    </>
  )
} 