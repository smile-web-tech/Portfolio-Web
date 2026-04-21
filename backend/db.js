import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://admin:adminpassword@localhost:5432/portfolio_cms?schema=public';

// Pre-flight check cache so we don't init multiple pools
let prismaClient;

if (!prismaClient) {
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  prismaClient = new PrismaClient({ adapter });
}

export const prisma = prismaClient;
