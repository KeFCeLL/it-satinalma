"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { getEtkinlikler, Etkinlik } from "@/lib/services/calendar-service";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export function DashboardCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [etkinlikler, setEtkinlikler] = useState<Etkinlik[]>([]);
  const [loading, setLoading] = useState(true);

  // Seçilen aya göre etkinlikleri getir
  useEffect(() => {
    if (!date) return;
    
    const fetchEtkinlikler = async () => {
      setLoading(true);
      try {
        // Seçilen ayın başlangıç ve bitiş tarihlerini hesapla
        const ayBaslangic = new Date(date.getFullYear(), date.getMonth(), 1);
        const aySonu = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const response = await getEtkinlikler({
          baslangic: ayBaslangic.toISOString(),
          bitis: aySonu.toISOString()
        });
        
        setEtkinlikler(response.data);
      } catch (error) {
        console.error('Etkinlikler yüklenirken hata:', error);
        toast.error('Etkinlikler yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEtkinlikler();
  }, [date]);

  // Yaklaşan etkinlikleri filtrele - sonraki 7 gün içindeki etkinlikler
  const yaklaşanEtkinlikler = React.useMemo(() => {
    if (!etkinlikler.length) return [];
    
    const simdi = new Date();
    const birHaftaSonra = new Date();
    birHaftaSonra.setDate(birHaftaSonra.getDate() + 7);
    
    return etkinlikler
      .filter(etkinlik => {
        const baslangicTarihi = new Date(etkinlik.baslangic);
        return baslangicTarihi >= simdi && baslangicTarihi <= birHaftaSonra;
      })
      .sort((a, b) => {
        return new Date(a.baslangic).getTime() - new Date(b.baslangic).getTime();
      })
      .slice(0, 3); // En yakın 3 etkinliği göster
  }, [etkinlikler]);

  // Etkinliğin tarihini formatla
  const formatEtkinlikTarihi = (baslangic: string | Date, bitis: string | Date) => {
    const baslangicDate = new Date(baslangic);
    const bitisDate = new Date(bitis);
    
    // Saat formatı: 09:00 - 10:30
    const saatFormati = (tarih: Date) => {
      return tarih.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    };
    
    return `${saatFormati(baslangicDate)} - ${saatFormati(bitisDate)}`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Takvim</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {date ? date.toLocaleDateString("tr-TR", {
            month: "long",
            year: "numeric"
          }) : "Tarih seçilmedi"}
        </div>
      </div>
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md border"
      />
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Yaklaşan Etkinlikler</h4>
        {loading ? (
          // Yükleme durumunda skeleton göster
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : yaklaşanEtkinlikler.length > 0 ? (
          // Etkinlikler varsa listele
          <div className="grid gap-2">
            {yaklaşanEtkinlikler.map((etkinlik) => (
              <div key={etkinlik.id} className="flex items-center space-x-4 rounded-md border p-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-xs font-bold text-primary">
                    {new Date(etkinlik.baslangic).getDate()}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{etkinlik.baslik}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatEtkinlikTarihi(etkinlik.baslangic, etkinlik.bitis)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Etkinlik yoksa mesaj göster
          <div className="rounded-md border p-4 text-center text-sm text-muted-foreground">
            <p>Yaklaşan etkinlik bulunmuyor</p>
          </div>
        )}
      </div>
    </div>
  );
} 