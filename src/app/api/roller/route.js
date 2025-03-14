import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { withAuth, withRole } from '../middleware';

// Tüm rolleri ve izinleri getir
async function getRolesHandler(request) {
  try {
    // Tüm rol-izin eşleştirmelerini getir
    const rolePermissions = await prisma.rolIzin.findMany();
    
    // Tüm izin tanımlarını getir
    const permissionDefinitions = await prisma.izinTanimi.findMany();
    
    // Rol enum değerlerini al ve isimleri belirle
    const roles = [
      { id: 'ADMIN', name: 'Sistem Yöneticisi' },
      { id: 'IT_ADMIN', name: 'IT Yöneticisi' },
      { id: 'FINANS_ADMIN', name: 'Finans Yöneticisi' },
      { id: 'SATINALMA_ADMIN', name: 'Satınalma Yöneticisi' },
      { id: 'DEPARTMAN_YONETICISI', name: 'Departman Yöneticisi' },
      { id: 'KULLANICI', name: 'Standart Kullanıcı' },
    ];

    // Her rol için izinleri grupla
    const rolesWithPermissions = roles.map(role => {
      const permissions = rolePermissions
        .filter(rp => rp.rolKodu === role.id)
        .map(rp => rp.izinKodu);
      
      return {
        ...role,
        permissions
      };
    });

    // Kategori bazında izin tanımlarını grupla
    const permissionsByCategory = permissionDefinitions.reduce((acc, perm) => {
      if (!acc[perm.kategori]) {
        acc[perm.kategori] = [];
      }
      acc[perm.kategori].push(perm);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      roles: rolesWithPermissions,
      permissionCategories: Object.keys(permissionsByCategory).map(categoryName => ({
        name: categoryName,
        permissions: permissionsByCategory[categoryName]
      }))
    });
  } catch (error) {
    console.error('Roller getirme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Roller getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Rol izinlerini güncelle
async function updateRolePermissionsHandler(request) {
  try {
    const { roleId, permissions } = await request.json();
    
    if (!roleId) {
      return NextResponse.json(
        { success: false, message: 'Rol ID gereklidir' },
        { status: 400 }
      );
    }

    // Önce bu rol için tüm izinleri sil
    await prisma.rolIzin.deleteMany({
      where: { rolKodu: roleId }
    });

    if (permissions && permissions.length > 0) {
      // Yeni izinleri ekle
      await prisma.rolIzin.createMany({
        data: permissions.map(permissionId => ({
          rolKodu: roleId,
          izinKodu: permissionId
        }))
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Rol izinleri başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Rol izinleri güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Rol izinleri güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// İzin tanımlarını yükle (seed)
async function seedPermissionsHandler(request) {
  try {
    const permissionData = await request.json();
    
    if (!permissionData || !permissionData.permissions) {
      return NextResponse.json(
        { success: false, message: 'İzin verileri gereklidir' },
        { status: 400 }
      );
    }

    // Tüm mevcut izin tanımlarını sil (sadece geliştirme ortamında)
    if (process.env.NODE_ENV !== 'production') {
      await prisma.izinTanimi.deleteMany();
    }

    // İzin tanımlarını ekle
    for (const category of Object.keys(permissionData.permissions)) {
      const permissions = permissionData.permissions[category];
      
      for (const perm of permissions) {
        await prisma.izinTanimi.create({
          data: {
            kod: perm.id,
            ad: perm.name,
            aciklama: perm.description,
            kategori: category
          }
        });
      }
    }

    // Varsayılan rol-izin eşleştirmelerini ekle
    if (permissionData.defaultRolePermissions) {
      // Önce tüm rol-izin eşleştirmelerini sil (sadece geliştirme ortamında)
      if (process.env.NODE_ENV !== 'production') {
        await prisma.rolIzin.deleteMany();
      }

      for (const rolePerm of permissionData.defaultRolePermissions) {
        await prisma.rolIzin.create({
          data: {
            rolKodu: rolePerm.roleId,
            izinKodu: rolePerm.permissionId
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'İzin tanımları başarıyla yüklendi'
    });
  } catch (error) {
    console.error('İzin tanımları yükleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'İzin tanımları yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Middleware kontrollerini ekliyoruz
export const GET = withAuth(getRolesHandler);
export const PUT = withRole(updateRolePermissionsHandler, ['ADMIN']);
export const POST = withRole(seedPermissionsHandler, ['ADMIN']); 