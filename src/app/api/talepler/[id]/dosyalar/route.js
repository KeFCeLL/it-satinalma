import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth } from '@/app/api/middleware';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Next.js API route config - dosya yükleme boyutunu artır
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '50mb',
  },
};

// Klasör oluşturma
const ensureUploadDir = async () => {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      console.error('Upload dizini oluşturma hatası:', error);
      throw error;
    }
  }
};

// Dosyaları listeleme
async function getDosyalarHandler(request, { params }) {
  try {
    const talepId = params.id;
    console.log(`Talep dosyaları getiriliyor, ID: ${talepId}`);

    // Talebin varlığını kontrol et
    const talep = await prisma.talep.findUnique({
      where: { id: talepId },
    });

    if (!talep) {
      console.warn(`Talep bulunamadı, ID: ${talepId}`);
      return NextResponse.json(
        { error: 'Talep bulunamadı' },
        { status: 404 }
      );
    }

    // Dosyaları getir
    const dosyalar = await prisma.dosya.findMany({
      where: { talepId },
      include: {
        yukleyen: {
          select: {
            id: true,
            ad: true,
            soyad: true,
          },
        },
      },
      orderBy: {
        yuklemeTarihi: 'desc',
      },
    });

    console.log(`${dosyalar.length} dosya bulundu`);
    return NextResponse.json({ dosyalar });
  } catch (error) {
    console.error('Dosyaları listeleme hatası:', error);
    return NextResponse.json(
      { error: 'Dosyaları listelerken bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

// Dosya yükleme
async function uploadDosyaHandler(request, { params }) {
  try {
    const talepId = params.id;
    const user = request.auth.user;
    console.log(`Dosya yükleme başlatıldı, Talep ID: ${talepId}, Kullanıcı: ${user.id}`);

    // Talebin varlığını kontrol et
    const talep = await prisma.talep.findUnique({
      where: { id: talepId },
    });

    if (!talep) {
      console.warn(`Talep bulunamadı, ID: ${talepId}`);
      return NextResponse.json(
        { error: 'Talep bulunamadı' },
        { status: 404 }
      );
    }

    // Form verilerini al
    console.log('Form verilerini okuma başlatıldı');
    const formData = await request.formData();
    const files = formData.getAll('dosya');
    const aciklama = formData.get('aciklama');
    
    console.log(`Yüklenen dosyalar: ${files.length}`);
    
    if (!files || files.length === 0) {
      console.warn('Dosya bulunamadı');
      return NextResponse.json(
        { error: 'Dosya bulunamadı' },
        { status: 400 }
      );
    }

    // Upload dizinini kontrol et
    await ensureUploadDir();
    
    // Talep için klasör oluştur
    const talepDir = path.join(UPLOAD_DIR, talepId);
    await mkdir(talepDir, { recursive: true });
    console.log(`Yükleme dizini oluşturuldu: ${talepDir}`);

    const savePromises = files.map(async (file, index) => {
      console.log(`Dosya işleniyor ${index + 1}/${files.length}: ${file.name} (${file.size} bytes)`);
      const buffer = Buffer.from(await file.arrayBuffer());
      const originalFilename = file.name;
      const mimeType = file.type;
      const fileSize = buffer.length;
      
      // Güvenli dosya adı oluştur
      const fileExtension = path.extname(originalFilename);
      const fileName = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(talepDir, fileName);
      const relativePath = path.join(talepId, fileName);
      
      // Dosyayı kaydet
      await writeFile(filePath, buffer);
      console.log(`Dosya kaydedildi: ${filePath}`);
      
      // Veritabanında dosya kaydı oluştur
      const dosya = await prisma.dosya.create({
        data: {
          talepId,
          ad: originalFilename,
          mimeTipi: mimeType,
          boyut: fileSize,
          yol: relativePath,
          yukleyenId: user.id,
          aciklama: aciklama || null,
        },
      });
      console.log(`Dosya veritabanına kaydedildi, ID: ${dosya.id}`);
      return dosya;
    });

    try {
      const savedFiles = await Promise.all(savePromises);
      console.log(`Toplam ${savedFiles.length} dosya başarıyla yüklendi`);
      
      return NextResponse.json({ 
        message: 'Dosyalar başarıyla yüklendi', 
        dosyalar: savedFiles 
      });
    } catch (saveError) {
      console.error('Dosya kaydetme hatası:', saveError);
      return NextResponse.json(
        { error: 'Dosya kaydedilirken bir hata oluştu', message: saveError.message },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Dosya yükleme hatası:', error);
    return NextResponse.json(
      { error: 'Dosya yüklenirken bir hata oluştu', message: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}

// Tüm dosyaları silme işlemi
async function deleteAllDosyalarHandler(request, { params }) {
  try {
    const talepId = params.id;
    const user = request.auth.user;
    console.log(`Tüm dosyaları silme isteği, Talep ID: ${talepId}, Kullanıcı: ${user.id}`);

    // Talebin varlığını kontrol et
    const talep = await prisma.talep.findUnique({
      where: {
        id: talepId,
      },
      select: {
        talepEdenId: true,
      },
    });

    if (!talep) {
      console.warn(`Talep bulunamadı, ID: ${talepId}`);
      return NextResponse.json(
        { error: 'Talep bulunamadı' },
        { status: 404 }
      );
    }

    // Yetki kontrolü - sadece talebi oluşturan kişi veya yöneticiler tüm dosyaları silebilir
    if (user.rol !== 'ADMIN' && user.rol !== 'IT_ADMIN' && user.id !== talep.talepEdenId) {
      console.warn(`Yetki hatası: Kullanıcı ${user.id} bu talep için dosyaları silme yetkisine sahip değil`);
      return NextResponse.json(
        { error: 'Bu işlem için yetkiniz yok' },
        { status: 403 }
      );
    }

    // Talebe ait dosyaları bul
    const dosyalar = await prisma.dosya.findMany({
      where: {
        talepId: talepId,
      },
      select: {
        id: true,
        yol: true,
      },
    });

    console.log(`Silinecek dosya sayısı: ${dosyalar.length}`);

    // Fiziksel dosyaları ve veritabanı kayıtlarını sil
    for (const dosya of dosyalar) {
      try {
        const filePath = path.join(UPLOAD_DIR, dosya.yol);
        await fs.promises.unlink(filePath).catch(err => 
          console.warn(`Dosya silinirken hata oluştu: ${err.message}`)
        );
        console.log(`Fiziksel dosya silindi: ${filePath}`);
      } catch (error) {
        console.warn(`Fiziksel dosya silinirken hata oluştu: ${error.message}`);
      }
    }

    // Veritabanından dosya kayıtlarını toplu sil
    const silinen = await prisma.dosya.deleteMany({
      where: {
        talepId: talepId,
      },
    });

    console.log(`Veritabanından ${silinen.count} dosya kaydı silindi`);

    return NextResponse.json({ 
      message: 'Tüm dosyalar başarıyla silindi',
      silinen_adet: dosyalar.length
    });
  } catch (error) {
    console.error('Dosya silme hatası:', error);
    return NextResponse.json(
      { error: 'Dosyalar silinirken bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

// Handler'ları auth kontrolü ile wrap et
export const GET = withAuth(getDosyalarHandler);
export const POST = withAuth(uploadDosyaHandler);
export const DELETE = withAuth(deleteAllDosyalarHandler); 