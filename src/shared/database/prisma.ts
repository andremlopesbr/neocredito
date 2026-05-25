import { PrismaClient } from '@prisma/client';

// Instanciação global e única do cliente Prisma (Singleton)
export const prisma = new PrismaClient();
