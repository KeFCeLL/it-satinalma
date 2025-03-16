import { NextResponse } from 'next/server';

// Mock kategori verileri
let mockKategoriler = [
  "Bilgisayar", 
  "Yazılım", 
  "Elektronik", 
  "Monitör", 
  "Aksesuar", 
  "Klima", 
  "Ağ Ekipmanları", 
  "Sunucu", 
  "Depolama", 
  "Diğer"
];

// Kategorileri getir
export async function GET(request) {
  try {
    console.log('Mock kategorileri getiriliyor');
    
    return NextResponse.json({
      success: true,
      kategoriler: mockKategoriler
    });
  } catch (error) {
    console.error('Kategoriler getirme hatası:', error);
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
    
    if (!body.kategori) {
      return NextResponse.json(
        { success: false, message: 'Kategori adı zorunludur' },
        { status: 400 }
      );
    }
    
    const yeniKategori = body.kategori.trim();
    
    // Kategori zaten var mı kontrol et
    if (mockKategoriler.includes(yeniKategori)) {
      return NextResponse.json(
        { success: false, message: 'Bu kategori zaten mevcut' },
        { status: 400 }
      );
    }
    
    // Kategoriyi ekle
    mockKategoriler.push(yeniKategori);
    
    console.log('Yeni kategori eklendi:', yeniKategori);
    
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
        { success: false, message: 'Kategori adı zorunludur' },
        { status: 400 }
      );
    }
    
    // Kategori var mı kontrol et
    const index = mockKategoriler.findIndex(k => k === kategori);
    if (index === -1) {
      return NextResponse.json(
        { success: false, message: 'Kategori bulunamadı' },
        { status: 404 }
      );
    }
    
    // Kategoriyi sil
    mockKategoriler = mockKategoriler.filter(k => k !== kategori);
    
    console.log('Kategori silindi:', kategori);
    
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