export enum TalepDurumu {
  BEKLEMEDE = "BEKLEMEDE",
  ONAYLANDI = "ONAYLANDI",
  REDDEDILDI = "REDDEDILDI",
  TAMAMLANDI = "TAMAMLANDI",
  IPTAL_EDILDI = "IPTAL_EDILDI",
  INCELEMEDE = "INCELEMEDE"
}

export enum OncelikDurumu {
  DUSUK = "DUSUK",
  ORTA = "ORTA",
  YUKSEK = "YUKSEK"
}

export interface TalepBase {
  id: string;
  baslik: string;
  aciklama: string;
  talepEdenId: string;
  talepTarihi: Date;
  durum: TalepDurumu;
  departmanId: string;
  oncelikDurumu: OncelikDurumu;
  miktar: number;
  tahminiTeslimTarihi: Date;
}

export interface Talep extends TalepBase {
  talepEden?: {
    id: string;
    ad: string;
    soyad: string;
    email: string;
  };
  departman?: {
    id: string;
    ad: string;
  };
  urun?: {
    id: string;
    ad: string;
    birimFiyat: number;
    kategori: string;
  };
  dosyalar?: {
    id: string;
    url: string;
    ad: string;
    boyut: number;
    mimeTipi: string;
    yuklemeTarihi: Date;
  }[];
} 