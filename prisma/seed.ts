import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcryptjs';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Use the variables from the .env file instead of hardcoded strings
  const scottPassword = await bcrypt.hash(process.env.SCOTT_PASSWORD || 'default_pass', 10);
  const suePassword = await bcrypt.hash(process.env.SUE_PASSWORD || 'default_pass', 10);

// Seed Scott
  await prisma.user.upsert({
    where: { email: process.env.SCOTT_EMAIL },
    update: {
      // Adding color here ensures it updates if you already exist
      color: '#C0392B', // A solid Matte Red
    },
    create: {
      name: 'Scott',
      email: process.env.SCOTT_EMAIL as string,
      password: scottPassword,
      color: '#C0392B',
    },
  });

  // Seed Sue
  await prisma.user.upsert({
    where: { email: process.env.SUE_EMAIL },
    update: {
      color: '#1ABC9C', // A vibrant Turquoise
    },
    create: {
      name: 'Sue',
      email: process.env.SUE_EMAIL as string,
      password: suePassword,
      color: '#1ABC9C',
    },
  });

  console.log('🌱 Database seeded using secure environment variables.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });