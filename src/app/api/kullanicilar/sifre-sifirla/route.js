import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, withRole } from '../../middleware';
import bcrypt from 'bcryptjs';

// Şifre oluşturma fonksiyonu
function generatePassword(options) {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  let chars = lowercase;
  if (options.includeUppercase) chars += uppercase;
  if (options.includeNumbers) chars += numbers;
  if (options.includeSpecialChars) chars += special;
  
  let password = '';
  for (let i = 0; i < options.length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }
  
  // En az bir karakter tipinden emin ol
  if (options.includeUppercase) password = ensureCharType(password, uppercase);
  if (options.includeNumbers) password = ensureCharType(password, numbers);
  if (options.includeSpecialChars) password = ensureCharType(password, special);
  
  return password;
}

// Belirli bir karakter tipinden en az bir tane olmasını sağla
function ensureCharType(password, chars) {
  if (!password.split('').some(char => chars.includes(char))) {
    const pos = Math.floor(Math.random() * password.length);
    const char = chars[Math.floor(Math.random() * chars.length)];
    return password.substring(0, pos) + char + password.substring(pos + 1);
  }
  return password;
}

// Şifre sıfırlama işleyicisi
async function resetPasswordsHandler(request) {
  try {
    const { userIds, options } = await request.json();
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Geçerli kullanıcı ID\'leri gerekli' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    // Her kullanıcı için şifre sıfırla
    for (const userId of userIds) {
      try {
        // Kullanıcıyı kontrol et
        const user = await prisma.kullanici.findUnique({
          where: { id: userId },
          select: { id: true, email: true, ad: true, soyad: true }
        });

        if (!user) {
          errors.push({ userId, error: 'Kullanıcı bulunamadı' });
          continue;
        }

        // Yeni şifre oluştur
        const newPassword = generatePassword(options);
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Şifreyi güncelle
        await prisma.kullanici.update({
          where: { id: userId },
          data: { sifre: hashedPassword }
        });

        // TODO: E-posta gönderimi burada yapılacak
        // await sendPasswordResetEmail(user.email, newPassword);

        results.push({
          userId,
          email: user.email,
          ad: user.ad,
          soyad: user.soyad,
          newPassword,
          success: true
        });
      } catch (error) {
        console.error(`Kullanıcı ${userId} için şifre sıfırlama hatası:`, error);
        errors.push({ userId, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${results.length} kullanıcının şifresi başarıyla sıfırlandı`,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Şifre sıfırlama hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Şifre sıfırlama işlemi sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}

export const POST = withRole(resetPasswordsHandler, ['ADMIN', 'IT_ADMIN']); 