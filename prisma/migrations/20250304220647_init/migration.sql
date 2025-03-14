-- CreateTable
CREATE TABLE "kullanicilar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "soyad" TEXT NOT NULL,
    "sifre" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'KULLANICI',
    "departmanId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "kullanicilar_departmanId_fkey" FOREIGN KEY ("departmanId") REFERENCES "departmanlar" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "departmanlar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ad" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "talepler" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "talepNo" TEXT NOT NULL,
    "baslik" TEXT NOT NULL,
    "aciklama" TEXT NOT NULL,
    "gerekce" TEXT,
    "departmanId" TEXT NOT NULL,
    "talepEdenId" TEXT NOT NULL,
    "onayDurumu" TEXT NOT NULL DEFAULT 'BEKLEMEDE',
    "oncelik" TEXT NOT NULL DEFAULT 'ORTA',
    "tahminiTutar" REAL,
    "talepTarihi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "talepler_departmanId_fkey" FOREIGN KEY ("departmanId") REFERENCES "departmanlar" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "talepler_talepEdenId_fkey" FOREIGN KEY ("talepEdenId") REFERENCES "kullanicilar" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "onaylar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "talepId" TEXT NOT NULL,
    "onaylayanId" TEXT,
    "adim" TEXT NOT NULL,
    "durum" TEXT NOT NULL DEFAULT 'BEKLEMEDE',
    "aciklama" TEXT,
    "tarih" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "onaylar_talepId_fkey" FOREIGN KEY ("talepId") REFERENCES "talepler" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "onaylar_onaylayanId_fkey" FOREIGN KEY ("onaylayanId") REFERENCES "kullanicilar" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "urunler" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ad" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "birimFiyat" REAL NOT NULL,
    "birim" TEXT NOT NULL DEFAULT 'Adet',
    "aciklama" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "urun_talepler" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "talepId" TEXT NOT NULL,
    "urunId" TEXT NOT NULL,
    "miktar" INTEGER NOT NULL,
    "tutar" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "urun_talepler_talepId_fkey" FOREIGN KEY ("talepId") REFERENCES "talepler" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "urun_talepler_urunId_fkey" FOREIGN KEY ("urunId") REFERENCES "urunler" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "talep_notlari" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "talepId" TEXT NOT NULL,
    "metin" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "talep_notlari_talepId_fkey" FOREIGN KEY ("talepId") REFERENCES "talepler" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bildirimler" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kullaniciId" TEXT NOT NULL,
    "baslik" TEXT NOT NULL,
    "mesaj" TEXT NOT NULL,
    "okundu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bildirimler_kullaniciId_fkey" FOREIGN KEY ("kullaniciId") REFERENCES "kullanicilar" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "kullanicilar_email_key" ON "kullanicilar"("email");

-- CreateIndex
CREATE UNIQUE INDEX "departmanlar_ad_key" ON "departmanlar"("ad");

-- CreateIndex
CREATE UNIQUE INDEX "talepler_talepNo_key" ON "talepler"("talepNo");
