import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const scottPassword = await bcrypt.hash('scott123', 10);
  const suePassword = await bcrypt.hash('sue123', 10);

  await prisma.user.upsert({
    where: { email: 'scott@calendar.app' },
    update: {},
    create: {
      name: 'Scott',
      email: 'scott@calendar.app',
      password: scottPassword,
      color: '#3b82f6',
    },
  });

  await prisma.user.upsert({
    where: { email: 'sue@calendar.app' },
    update: {},
    create: {
      name: 'Sue',
      email: 'sue@calendar.app',
      password: suePassword,
      color: '#ec4899',
    },
  });

  console.log('Seeded users: Scott (scott@calendar.app / scott123) and Sue (sue@calendar.app / sue123)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
