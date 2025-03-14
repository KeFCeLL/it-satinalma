import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(request) {
  console.log("Kullanıcı bilgileri isteği alındı");
  
  try {
    // Cookie'den token al
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    // Token yoksa hata döndür
    if (!token) {
      console.log("Token bulunamadı");
      return NextResponse.json(
        { error: "Yetkilendirme gerekli" },
        { status: 401 }
      );
    }

    // Token'ı doğrula
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token doğrulandı, kullanıcı ID:", decoded.id);
    } catch (error) {
      console.error("Token doğrulama hatası:", error);
      
      // Token geçersiz veya süresi dolmuş
      return NextResponse.json(
        { error: "Geçersiz veya süresi dolmuş token" },
        { status: 401 }
      );
    }

    // Kullanıcıyı bul
    const user = await prisma.kullanici.findUnique({
      where: { id: decoded.id },
      include: {
        departman: {
          select: {
            id: true,
            ad: true,
          },
        },
      },
    });

    // Kullanıcı bulunamadıysa hata döndür
    if (!user) {
      console.log("Kullanıcı bulunamadı, ID:", decoded.id);
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 401 }
      );
    }

    // Kullanıcı bilgilerini döndür (şifre hariç)
    const { sifre, ...userWithoutPassword } = user;
    
    console.log("Kullanıcı bilgileri gönderildi");
    return NextResponse.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error("Kullanıcı bilgileri getirme hatası:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
} 