-- CreateTable
CREATE TABLE "etkinlikler" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "baslik" TEXT NOT NULL,
    "baslangic" DATETIME NOT NULL,
    "bitis" DATETIME NOT NULL,
    "konum" TEXT,
    "aciklama" TEXT,
    "kullaniciId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "etkinlikler_kullaniciId_fkey" FOREIGN KEY ("kullaniciId") REFERENCES "kullanicilar" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "gorevler" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metin" TEXT NOT NULL,
    "tamamlandi" BOOLEAN NOT NULL DEFAULT false,
    "kullaniciId" TEXT NOT NULL,
    "sonTarih" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "gorevler_kullaniciId_fkey" FOREIGN KEY ("kullaniciId") REFERENCES "kullanicilar" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
