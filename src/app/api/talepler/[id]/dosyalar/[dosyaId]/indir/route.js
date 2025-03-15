import { NextResponse } from "next/server";
import prisma from '@/lib/prisma';
import fs from "fs";
import path from "path";
import { withAuth } from "../../../../../middleware";

export const config = {
  api: {
    responseLimit: '50mb',
  },
};

async function getDosyaHandler(req, { params }) {
  try {
    const { id: talepId, dosyaId } = params;
    
    // Talebin varlığını kontrol et
    const talep = await prisma.talep.findUnique({
      where: { id: talepId },
    });

    if (!talep) {
      return new NextResponse(JSON.stringify({ 
        error: "Talep bulunamadı" 
      }), { 
        status: 404, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    // Dosyayı veritabanından al
    const dosya = await prisma.dosya.findUnique({
      where: {
        id: dosyaId,
        talepId: talepId,
      },
    });

    if (!dosya) {
      return new NextResponse(JSON.stringify({ 
        error: "Dosya bulunamadı" 
      }), { 
        status: 404, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    const filePath = path.join(process.cwd(), dosya.yol);
    
    // Dosyanın var olup olmadığını kontrol et
    if (!fs.existsSync(filePath)) {
      console.error(`Dosya bulunamadı: ${filePath}`);
      return new NextResponse(JSON.stringify({ 
        error: "Fiziksel dosya bulunamadı" 
      }), { 
        status: 404, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    // Dosya içeriğini oku
    const fileBuffer = fs.readFileSync(filePath);
    
    // İndirme başlıklarını ayarla
    const headers = new Headers();
    headers.set("Content-Type", dosya.mimeTipi || "application/octet-stream");
    headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(dosya.ad)}"`);
    headers.set("Content-Length", fileBuffer.length.toString());

    // Dosya içeriğini döndür
    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error("Dosya indirme hatası:", error);
    return new NextResponse(JSON.stringify({ 
      error: "Dosya indirme işlemi sırasında bir hata oluştu" 
    }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
}

export const GET = withAuth(getDosyaHandler); 
