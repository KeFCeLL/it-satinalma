import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { withAuth, withRole } from '../middleware';

// Tüm rolleri ve izinleri getir
async function getRolesHandler(request) {
  try {
    if (!prisma) {
      throw new Error('Prisma istemcisi başlatılamadı');
    }

    // Tüm izin tanımlarını getir
    const permissionDefinitions = await prisma.izinTanimi.findMany();
    console.log('Bulunan izin tanımları:', permissionDefinitions);

    // Tüm rol-izin eşleştirmelerini getir
    const rolePermissions = await prisma.rolIzin.findMany();
    console.log('Bulunan rol-izin eşleştirmeleri:', rolePermissions);

    // Statik rol listesi
    const roles = [
      { kod: 'ADMIN', ad: 'Sistem Yöneticisi' },
      { kod: 'IT_ADMIN', ad: 'IT Yöneticisi' },
      { kod: 'FINANS_ADMIN', ad: 'Finans Yöneticisi' },
      { kod: 'SATINALMA_ADMIN', ad: 'Satınalma Yöneticisi' },
      { kod: 'DEPARTMAN_YONETICISI', ad: 'Departman Yöneticisi' },
      { kod: 'KULLANICI', ad: 'Standart Kullanıcı' }
    ];

    // Her rol için izinleri grupla
    const rolesWithPermissions = roles.map(role => {
      const permissions = rolePermissions
        .filter(rp => rp.rolKodu === role.kod)
        .map(rp => rp.izinKodu);
      
      return {
        id: role.kod,
        name: role.ad,
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
    console.error('Detaylı hata bilgisi:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      prisma: !!prisma
    });
    
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Roller getirilirken bir hata oluştu',
        error: error.toString()
      },
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
    
    // Güncellenmiş rol ve izinleri getir
    const updatedRole = await prisma.rolIzin.findMany({
      where: { rolKodu: roleId },
      select: { izinKodu: true }
    });

    return NextResponse.json({
      success: true,
      message: 'Rol izinleri başarıyla güncellendi',
      permissions: updatedRole.map(rp => rp.izinKodu)
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

    // İzin tanımlarını ekle
    for (const [category, permissions] of Object.entries(permissionData.permissions)) {
      for (const perm of permissions) {
        try {
          await prisma.izinTanimi.upsert({
            where: { kod: perm.id },
            update: {
              ad: perm.name,
              aciklama: perm.description,
              kategori: category
            },
            create: {
              kod: perm.id,
              ad: perm.name,
              aciklama: perm.description,
              kategori: category
            }
          });
        } catch (error) {
          console.error(`İzin tanımı eklenirken hata (${perm.id}):`, error);
          throw new Error(`İzin tanımı eklenirken hata: ${perm.id}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'İzin tanımları başarıyla yüklendi'
    });
  } catch (error) {
    console.error('İzin tanımları yükleme hatası:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'İzin tanımları yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Rol ekle
async function createRoleHandler(request) {
  try {
    const { id, name } = await request.json();
    
    if (!id || !name) {
      return NextResponse.json(
        { success: false, message: 'Rol ID ve adı gereklidir' },
        { status: 400 }
      );
    }

    // Rolü ekle
    const newRole = await prisma.rol.create({
      data: {
        kod: id,
        ad: name
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Rol başarıyla eklendi',
      role: newRole
    });
  } catch (error) {
    console.error('Rol ekleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Rol eklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Rol güncelle
async function updateRoleHandler(request) {
  try {
    const { id, name } = await request.json();
    
    if (!id || !name) {
      return NextResponse.json(
        { success: false, message: 'Rol ID ve adı gereklidir' },
        { status: 400 }
      );
    }

    // Rolü güncelle
    const updatedRole = await prisma.rol.update({
      where: { kod: id },
      data: { ad: name }
    });

    return NextResponse.json({
      success: true,
      message: 'Rol başarıyla güncellendi',
      role: updatedRole
    });
  } catch (error) {
    console.error('Rol güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Rol güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Rol sil
async function deleteRoleHandler(request) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Rol ID gereklidir' },
        { status: 400 }
      );
    }

    // Önce rol-izin eşleştirmelerini sil
    await prisma.rolIzin.deleteMany({
      where: { rolKodu: id }
    });

    // Rolü sil
    await prisma.rol.delete({
      where: { kod: id }
    });

    return NextResponse.json({
      success: true,
      message: 'Rol başarıyla silindi'
    });
  } catch (error) {
    console.error('Rol silme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Rol silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Middleware kontrollerini ekliyoruz
export const GET = withAuth(getRolesHandler);
export const POST = withRole(createRoleHandler, ['ADMIN']);
export const PUT = withRole(updateRoleHandler, ['ADMIN']);
export const DELETE = withRole(deleteRoleHandler, ['ADMIN']); 