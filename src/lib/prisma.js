/**
 * @file prisma.js
 * @description Singleton pattern ile PrismaClient instance'ı oluşturur ve export eder.
 * Bu yaklaşım, development sırasında hot reloading nedeniyle birden çok
 * PrismaClient bağlantısı oluşmasını engeller.
 */

import { PrismaClient } from '@prisma/client';

// PrismaClient global scope'a kaydedilir
const globalForPrisma = global;

// globalThis'e prisma eklenip eklenmediğini kontrol et
const prisma = globalForPrisma.prisma || new PrismaClient();

// Development ortamında hot reloading sırasında birden çok
// bağlantı açılmasını engellemek için global değişkene atama yap
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma; 