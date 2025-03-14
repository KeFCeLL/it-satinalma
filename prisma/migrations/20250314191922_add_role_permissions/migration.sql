-- CreateTable
CREATE TABLE "RolIzin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rolKodu" TEXT NOT NULL,
    "izinKodu" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "IzinTanimi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kod" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "aciklama" TEXT,
    "kategori" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "RolIzin_rolKodu_izinKodu_key" ON "RolIzin"("rolKodu", "izinKodu");

-- CreateIndex
CREATE UNIQUE INDEX "IzinTanimi_kod_key" ON "IzinTanimi"("kod");
