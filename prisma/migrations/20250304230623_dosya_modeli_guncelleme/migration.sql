/*
  Warnings:

  - You are about to drop the `talepler` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "talepler_talepNo_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "talepler";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Talep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "baslik" TEXT NOT NULL,
    "aciklama" TEXT NOT NULL,
    "talepEdenId" TEXT NOT NULL,
    "departmanId" TEXT NOT NULL,
    "durum" TEXT NOT NULL,
    "oncelik" TEXT NOT NULL,
    "urunId" TEXT,
    "miktar" INTEGER NOT NULL DEFAULT 1,
    "onayAdimi" TEXT,
    "tahminiTeslimTarihi" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Talep_talepEdenId_fkey" FOREIGN KEY ("talepEdenId") REFERENCES "kullanicilar" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Talep_departmanId_fkey" FOREIGN KEY ("departmanId") REFERENCES "departmanlar" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Talep_urunId_fkey" FOREIGN KEY ("urunId") REFERENCES "urunler" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Dosya" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ad" TEXT NOT NULL,
    "mimeTipi" TEXT NOT NULL,
    "boyut" INTEGER NOT NULL,
    "yol" TEXT NOT NULL,
    "aciklama" TEXT,
    "talepId" TEXT NOT NULL,
    "yukleyenId" TEXT NOT NULL,
    "yuklemeTarihi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Dosya_talepId_fkey" FOREIGN KEY ("talepId") REFERENCES "Talep" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Dosya_yukleyenId_fkey" FOREIGN KEY ("yukleyenId") REFERENCES "kullanicilar" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_onaylar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "talepId" TEXT NOT NULL,
    "onaylayanId" TEXT,
    "adim" TEXT NOT NULL,
    "durum" TEXT NOT NULL DEFAULT 'BEKLEMEDE',
    "aciklama" TEXT,
    "tarih" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "onaylar_talepId_fkey" FOREIGN KEY ("talepId") REFERENCES "Talep" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "onaylar_onaylayanId_fkey" FOREIGN KEY ("onaylayanId") REFERENCES "kullanicilar" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_onaylar" ("aciklama", "adim", "createdAt", "durum", "id", "onaylayanId", "talepId", "tarih") SELECT "aciklama", "adim", "createdAt", "durum", "id", "onaylayanId", "talepId", "tarih" FROM "onaylar";
DROP TABLE "onaylar";
ALTER TABLE "new_onaylar" RENAME TO "onaylar";
CREATE TABLE "new_talep_notlari" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "talepId" TEXT NOT NULL,
    "metin" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "talep_notlari_talepId_fkey" FOREIGN KEY ("talepId") REFERENCES "Talep" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_talep_notlari" ("createdAt", "id", "metin", "talepId") SELECT "createdAt", "id", "metin", "talepId" FROM "talep_notlari";
DROP TABLE "talep_notlari";
ALTER TABLE "new_talep_notlari" RENAME TO "talep_notlari";
CREATE TABLE "new_urun_talepler" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "talepId" TEXT NOT NULL,
    "urunId" TEXT NOT NULL,
    "miktar" INTEGER NOT NULL,
    "tutar" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "urun_talepler_talepId_fkey" FOREIGN KEY ("talepId") REFERENCES "Talep" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "urun_talepler_urunId_fkey" FOREIGN KEY ("urunId") REFERENCES "urunler" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_urun_talepler" ("createdAt", "id", "miktar", "talepId", "tutar", "updatedAt", "urunId") SELECT "createdAt", "id", "miktar", "talepId", "tutar", "updatedAt", "urunId" FROM "urun_talepler";
DROP TABLE "urun_talepler";
ALTER TABLE "new_urun_talepler" RENAME TO "urun_talepler";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Talep_talepEdenId_idx" ON "Talep"("talepEdenId");

-- CreateIndex
CREATE INDEX "Talep_departmanId_idx" ON "Talep"("departmanId");

-- CreateIndex
CREATE INDEX "Talep_urunId_idx" ON "Talep"("urunId");

-- CreateIndex
CREATE INDEX "Talep_durum_idx" ON "Talep"("durum");

-- CreateIndex
CREATE UNIQUE INDEX "Dosya_yol_key" ON "Dosya"("yol");

-- CreateIndex
CREATE INDEX "Dosya_talepId_idx" ON "Dosya"("talepId");

-- CreateIndex
CREATE INDEX "Dosya_yukleyenId_idx" ON "Dosya"("yukleyenId");
