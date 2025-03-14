-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Talep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "baslik" TEXT NOT NULL,
    "aciklama" TEXT NOT NULL,
    "talepEdenId" TEXT NOT NULL,
    "departmanId" TEXT NOT NULL,
    "durum" TEXT NOT NULL DEFAULT 'TASLAK',
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
INSERT INTO "new_Talep" ("aciklama", "baslik", "createdAt", "departmanId", "durum", "id", "miktar", "onayAdimi", "oncelik", "tahminiTeslimTarihi", "talepEdenId", "updatedAt", "urunId") SELECT "aciklama", "baslik", "createdAt", "departmanId", "durum", "id", "miktar", "onayAdimi", "oncelik", "tahminiTeslimTarihi", "talepEdenId", "updatedAt", "urunId" FROM "Talep";
DROP TABLE "Talep";
ALTER TABLE "new_Talep" RENAME TO "Talep";
CREATE INDEX "Talep_talepEdenId_idx" ON "Talep"("talepEdenId");
CREATE INDEX "Talep_departmanId_idx" ON "Talep"("departmanId");
CREATE INDEX "Talep_urunId_idx" ON "Talep"("urunId");
CREATE INDEX "Talep_durum_idx" ON "Talep"("durum");
CREATE TABLE "new_kullanicilar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "soyad" TEXT NOT NULL,
    "sifre" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'KULLANICI',
    "departmanId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "durum" TEXT NOT NULL DEFAULT 'AKTIF',
    "sonGirisTarihi" DATETIME,
    "resetToken" TEXT,
    "resetTokenExpiry" DATETIME,
    CONSTRAINT "kullanicilar_departmanId_fkey" FOREIGN KEY ("departmanId") REFERENCES "departmanlar" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_kullanicilar" ("ad", "createdAt", "departmanId", "email", "id", "rol", "sifre", "soyad", "updatedAt") SELECT "ad", "createdAt", "departmanId", "email", "id", "rol", "sifre", "soyad", "updatedAt" FROM "kullanicilar";
DROP TABLE "kullanicilar";
ALTER TABLE "new_kullanicilar" RENAME TO "kullanicilar";
CREATE UNIQUE INDEX "kullanicilar_email_key" ON "kullanicilar"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
