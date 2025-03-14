import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Çıkış yapma işlemi
export async function POST() {
  try {
    console.log("Çıkış isteği alındı");
    
    // Cookie store'u al
    const cookieStore = await cookies();
    
    // Token cookie'lerini temizle
    cookieStore.delete("token");
    cookieStore.delete("refresh_token");
    
    // Set-Cookie header'ları ile cookie'leri client-side'da da temizle
    const response = NextResponse.json({
      success: true,
      message: "Çıkış başarılı"
    });
    
    // Cookie'leri boş değerle ve geçmiş tarihle set ederek siliyoruz
    response.cookies.set("token", "", { 
      expires: new Date(0),
      path: "/"
    });
    
    response.cookies.set("refresh_token", "", {
      expires: new Date(0),
      path: "/"
    });
    
    console.log("Çıkış başarılı, cookie'ler temizlendi");
    return response;
  } catch (error) {
    console.error("Çıkış sırasında hata:", error);
    return NextResponse.json(
      { error: "Çıkış sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
} 