import { NextResponse } from 'next/server';

// Mock kategori verileri
let mockKategoriler = [
  "Bilgisayar",
  "Monitör",
  "Yazılım",
  "Aksesuar",
  "Elektronik",
  "Klima",
  "Mobilya",
  "Kırtasiye"
];

// Kategorileri getir
export async function GET(request) {
  try {
    console.log('Mock kategoriler getiriliyor');
    
    return NextResponse.json({
      success: true,
      kategoriler: mockKategoriler
    });
  } catch (error) {
    console.error('Kategorileri getirme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Kategoriler alınamadı', error: error.message },
      { status: 500 }
    );
  }
}

// Kategori ekle
export async function POST(request) {
  try {
    const body = await request.json();
    const { kategori } = body;
    
    if (!kategori) {
      return NextResponse.json(
        { success: false, message: 'Kategori adı zorunludur' },
        { status: 400 }
      );
    }
    
    // Kategori zaten var mı kontrol et
    if (mockKategoriler.includes(kategori)) {
      return NextResponse.json(
        { success: false, message: 'Bu kategori zaten mevcut' },
        { status: 400 }
      );
    }
    
    // Kategoriyi ekle
    mockKategoriler.push(kategori);
    
    return NextResponse.json({
      success: true,
      message: 'Kategori başarıyla eklendi',
      kategoriler: mockKategoriler
    });
  } catch (error) {
    console.error('Kategori ekleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Kategori eklenemedi', error: error.message },
      { status: 500 }
    );
  }
}

// Kategori sil
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const kategori = searchParams.get('kategori');
    
    if (!kategori) {
      return NextResponse.json(
        { success: false, message: 'Silinecek kategori adı belirtilmedi' },
        { status: 400 }
      );
    }
    
    // Kategori var mı kontrol et
    const kategoriIndex = mockKategoriler.indexOf(kategori);
    if (kategoriIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Kategori bulunamadı' },
        { status: 404 }
      );
    }
    
    // Kategoriyi sil
    mockKategoriler = mockKategoriler.filter(k => k !== kategori);
    
    return NextResponse.json({
      success: true,
      message: 'Kategori başarıyla silindi',
      kategoriler: mockKategoriler
    });
  } catch (error) {
    console.error('Kategori silme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Kategori silinemedi', error: error.message },
      { status: 500 }
    );
  }
} 