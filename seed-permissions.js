// İzin verileri yükleme scripti
const fs = require('fs');
const http = require('http');

// Varsayılan izin verilerini tanımla
const permissionData = {
  permissions: {
    "Kullanıcı Yönetimi": [
      { id: "user.view", name: "Kullanıcıları Görüntüleme", description: "Sistemdeki tüm kullanıcıları görüntüleme yetkisi" },
      { id: "user.create", name: "Kullanıcı Oluşturma", description: "Sisteme yeni kullanıcı ekleme yetkisi" },
      { id: "user.edit", name: "Kullanıcı Düzenleme", description: "Mevcut kullanıcıları düzenleme yetkisi" },
      { id: "user.delete", name: "Kullanıcı Silme", description: "Kullanıcıları sistemden silme yetkisi" },
      { id: "role.manage", name: "Rol Yönetimi", description: "Rol ve izin yönetimi yapma yetkisi" }
    ],
    "Talep Yönetimi": [
      { id: "request.create", name: "Talep Oluşturma", description: "Yeni satınalma talebi oluşturma yetkisi" },
      { id: "request.view_own", name: "Kendi Taleplerini Görüntüleme", description: "Kullanıcının kendi taleplerini görüntüleme yetkisi" },
      { id: "request.view_all", name: "Tüm Talepleri Görüntüleme", description: "Sistemdeki tüm talepleri görüntüleme yetkisi" },
      { id: "request.approve", name: "Talep Onaylama", description: "Talepleri onaylama yetkisi" },
      { id: "request.reject", name: "Talep Reddetme", description: "Talepleri reddetme yetkisi" },
      { id: "request.edit", name: "Talep Düzenleme", description: "Mevcut talepleri düzenleme yetkisi" },
      { id: "request.delete", name: "Talep Silme", description: "Talepleri silme yetkisi" }
    ],
    "Satınalma Yönetimi": [
      { id: "purchase.process", name: "Satınalma Süreci", description: "Satınalma sürecini yönetme yetkisi" },
      { id: "purchase.approve", name: "Satınalma Onaylama", description: "Satınalma işlemlerini onaylama yetkisi" },
      { id: "purchase.complete", name: "Satınalma Tamamlama", description: "Satınalma işlemlerini tamamlama yetkisi" }
    ]
  },
  defaultRolePermissions: [
    {roleId: "ADMIN", permissionId: "user.view"},
    {roleId: "ADMIN", permissionId: "user.create"},
    {roleId: "ADMIN", permissionId: "user.edit"},
    {roleId: "ADMIN", permissionId: "user.delete"},
    {roleId: "ADMIN", permissionId: "role.manage"},
    {roleId: "ADMIN", permissionId: "request.create"},
    {roleId: "ADMIN", permissionId: "request.view_own"},
    {roleId: "ADMIN", permissionId: "request.view_all"},
    {roleId: "ADMIN", permissionId: "request.approve"},
    {roleId: "ADMIN", permissionId: "request.reject"},
    {roleId: "ADMIN", permissionId: "request.edit"},
    {roleId: "ADMIN", permissionId: "request.delete"},
    {roleId: "ADMIN", permissionId: "purchase.process"},
    {roleId: "ADMIN", permissionId: "purchase.approve"},
    {roleId: "ADMIN", permissionId: "purchase.complete"},
    {roleId: "KULLANICI", permissionId: "request.create"},
    {roleId: "KULLANICI", permissionId: "request.view_own"}
  ]
};

// API'ye POST isteği gönder
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/roller',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`API yanıt durumu: ${res.statusCode}`);
  
  res.on('data', (chunk) => {
    console.log(`Yanıt: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`API isteği sırasında hata: ${e.message}`);
});

// Verileri gönder
req.write(JSON.stringify(permissionData));
req.end();

console.log('İzin verileri yükleme isteği gönderildi.'); 