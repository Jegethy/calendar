import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./client/client";
import bcrypt from 'bcryptjs';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Use the variables from the .env file instead of hardcoded strings
  const scottPassword = await bcrypt.hash(process.env.SCOTT_PASSWORD || 'default_pass', 10);
  const suePassword = await bcrypt.hash(process.env.SUE_PASSWORD || 'default_pass', 10);

  await prisma.user.upsert({
    where: { email: process.env.SCOTT_EMAIL },
    update: {},
    create: {
      name: 'Scott',
      email: process.env.SCOTT_EMAIL as string,
      password: scottPassword,
      color: '#3b82f6',
    },
  });

  await prisma.user.upsert({
    where: { email: process.env.SUE_EMAIL },
    update: {},
    create: {
      name: 'Sue',
      email: process.env.SUE_EMAIL as string,
      password: suePassword,
      color: '#ec4899',
    },
  });

  console.log('🌱 Database seeded using secure environment variables.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });