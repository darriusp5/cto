import { PrismaClient } from '@prisma/client';

/** Единственный экземпляр PrismaClient на процесс. */
export const prisma = new PrismaClient();
