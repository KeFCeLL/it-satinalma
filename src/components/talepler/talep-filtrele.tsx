"use client"

import { useEffect, useState } from "react"
import { CalendarIcon, FilterIcon, SearchIcon, XCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { Department, getDepartmentOptions } from "@/lib/services"

interface TalepFiltreProps {
  onFilterChange: (filters: TalepFiltresi) => void
}

export interface TalepFiltresi {
  arama: string
  durum: string
  departman: string
  tarihBaslangic: Date | undefined
  tarihBitis: Date | undefined
}

export function TalepFiltrele({ onFilterChange }: TalepFiltreProps) {
  const [filters, setFilters] = useState<TalepFiltresi>({
    arama: "",
    durum: "all",
    departman: "all",
    tarihBaslangic: undefined,
    tarihBitis: undefined,
  })
  
  const [tarihPopoverAcik, setTarihPopoverAcik] = useState(false)
  const [departmanlar, setDepartmanlar] = useState<Department[]>([])
  const [departmanlarYukleniyor, setDepartmanlarYukleniyor] = useState(true)
  
  // Departmanları API'den al
  useEffect(() => {
    const fetchDepartmanlar = async () => {
      try {
        const response = await getDepartmentOptions();
        setDepartmanlar(response.departmanlar);
      } catch (error) {
        console.error("Departmanlar alınırken hata oluştu:", error);
      } finally {
        setDepartmanlarYukleniyor(false);
      }
    };
    
    fetchDepartmanlar();
  }, []);
  
  const durumlar = [
    { value: "all", label: "Tüm Durumlar" },
    { value: "onay-bekliyor", label: "Onay Bekliyor" },
    { value: "onaylandi", label: "Onaylandı" },
    { value: "tamamlandi", label: "Tamamlandı" },
    { value: "reddedildi", label: "Reddedildi" },
    { value: "satinalma", label: "Satınalma Sürecinde" },
    { value: "iptal", label: "İptal Edildi" },
  ]
  
  const handleFilterChange = (key: keyof TalepFiltresi, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }
  
  const handleTarihSecimi = (range: { from?: Date; to?: Date } | undefined) => {
    handleFilterChange("tarihBaslangic", range?.from)
    handleFilterChange("tarihBitis", range?.to)
    
    if (range?.to) {
      setTarihPopoverAcik(false)
    }
  }
  
  const temizle = () => {
    const resetFilters = {
      arama: "",
      durum: "all",
      departman: "all",
      tarihBaslangic: undefined,
      tarihBitis: undefined,
    }
    setFilters(resetFilters)
    onFilterChange(resetFilters)
  }
  
  // Aktif filtre sayısını hesapla
  const aktifFiltreSayisi = [
    filters.arama !== "",
    filters.durum !== "all",
    filters.departman !== "all",
    filters.tarihBaslangic !== undefined,
  ].filter(Boolean).length
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Taleplerde ara..."
            className="pl-8"
            value={filters.arama}
            onChange={(e) => handleFilterChange("arama", e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select 
            value={filters.durum} 
            onValueChange={(value) => handleFilterChange("durum", value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Durum Filtresi" />
            </SelectTrigger>
            <SelectContent>
              {durumlar.map((durum) => (
                <SelectItem key={durum.value} value={durum.value}>
                  {durum.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={filters.departman} 
            onValueChange={(value) => handleFilterChange("departman", value)}
            disabled={departmanlarYukleniyor}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={departmanlarYukleniyor ? "Yükleniyor..." : "Departman"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Departmanlar</SelectItem>
              {departmanlar && departmanlar.map((departman) => (
                <SelectItem key={departman.id} value={departman.id}>
                  {departman.ad}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Popover open={tarihPopoverAcik} onOpenChange={setTarihPopoverAcik}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                locale={tr}
                selected={{
                  from: filters.tarihBaslangic,
                  to: filters.tarihBitis,
                }}
                onSelect={handleTarihSecimi}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          {aktifFiltreSayisi > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={temizle}
              className="gap-1"
            >
              <XCircleIcon className="h-4 w-4" />
              Temizle
              <Badge variant="secondary" className="ml-1">
                {aktifFiltreSayisi}
              </Badge>
            </Button>
          )}
        </div>
      </div>
      
      {/* Aktif filtreler */}
      {aktifFiltreSayisi > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.arama && (
            <Badge variant="secondary" className="gap-1">
              Arama: {filters.arama}
              <button 
                onClick={() => handleFilterChange("arama", "")} 
                className="ml-1 hover:text-destructive"
              >
                <XCircleIcon className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.durum !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Durum: {durumlar.find(d => d.value === filters.durum)?.label}
              <button 
                onClick={() => handleFilterChange("durum", "all")} 
                className="ml-1 hover:text-destructive"
              >
                <XCircleIcon className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.departman !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Departman: {departmanlar && departmanlar.find(d => d.id === filters.departman)?.ad || "..."}
              <button 
                onClick={() => handleFilterChange("departman", "all")} 
                className="ml-1 hover:text-destructive"
              >
                <XCircleIcon className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.tarihBaslangic && (
            <Badge variant="secondary" className="gap-1">
              Tarih: {format(filters.tarihBaslangic, "dd MMM yyyy", { locale: tr })}
              {filters.tarihBitis && ` - ${format(filters.tarihBitis, "dd MMM yyyy", { locale: tr })}`}
              <button 
                onClick={() => {
                  handleFilterChange("tarihBaslangic", undefined)
                  handleFilterChange("tarihBitis", undefined)
                }} 
                className="ml-1 hover:text-destructive"
              >
                <XCircleIcon className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
} 