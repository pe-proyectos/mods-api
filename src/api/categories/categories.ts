import { Elysia, t } from 'elysia';
import { prisma } from '../../services/prisma';

export const router = new Elysia()
    .get(
        '/api/categories',
        async () => {
            const categories = await prisma.category.findMany({
                orderBy: {
                    name: 'asc',
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                }
            })
            return categories
        },
    );
