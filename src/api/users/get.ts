import { Elysia, NotFoundError, t } from 'elysia';
import { prisma } from '../../services/prisma';

export const router = new Elysia()
    .get(
        '/api/users/:user_slug',
        async ({ params: { user_slug } }) => {
            const user = await prisma.user.findFirst({
                where: {
                    slug: user_slug,
                },
                select: {
                    name: true,
                    slug: true,
                    imageUrl: true,
                }
            })

            if (!user) {
                throw new NotFoundError()
            }

            return user
        }
    );
