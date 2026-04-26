import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@zaneva.com';
  const password = 'zaneva2024';
  const name = 'Rizky Zaneva';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`✅ User sudah ada: ${email}`);
    return;
  }

  const hashedPassword = bcrypt.hashSync(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      name,
      role: 'OWNER',
    },
  });

  console.log('🎉 Akun Owner berhasil dibuat!');
  console.log(`   Email    : ${user.email}`);
  console.log(`   Password : ${password}`);
  console.log(`   Role     : ${user.role}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
