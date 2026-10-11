import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('Falta DATABASE_URL')

/** Cliente único de Prisma para toda la API */
export const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
