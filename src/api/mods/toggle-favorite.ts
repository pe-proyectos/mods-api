import { Elysia, NotFoundError, t } from 'elysia'

import { prisma } from '../../services/prisma';
import { authMiddleware } from '../../middlewares/auth.middleware'


export const router = new Elysia()
    .use(authMiddleware({ loggedOnly: true }))
    .get(
        '/api/mods/:code/favorite',
        async ({ params: { code }, user }) => {
            const mod = await prisma.mod.findFirst({
              where: {
                code
              }
            });
            if (!mod) {
              throw new NotFoundError();
            }
            
            const count = await prisma.modFavorite.count({
              where: {
                modId: mod.id,
              }
            });

            const favorite = await prisma.modFavorite.findFirst({
              where: {
                modId: mod.id,
                userId: user?.id,
              }
            });
            if (favorite) {
              await prisma.modFavorite.delete({
                where: {
                  id: favorite.id,
                }
              });
              return { favorite: false, count: count - 1, message: 'Mod removed from favorites.' };
            }
            await prisma.modFavorite.create({
              data: {
                modId: mod.id,
                userId: user?.id,
              }
            });
            return { favorite: true, count: count + 1, message: 'Mod added to favorites.' };
        }, {
            response: t.Object({
              favorite: t.Boolean(),
              count: t.Number(),
              message: t.String(),
            }),
        }
    )