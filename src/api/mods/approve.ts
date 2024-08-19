import { Elysia, NotFoundError, t } from 'elysia'

import { prisma } from '../../services/prisma';
import { authMiddleware } from '../../middlewares/auth.middleware'


export const router = new Elysia()
    .use(authMiddleware({ loggedOnly: true }))
    .get(
        '/api/mods/:code/approve',
        async ({ params: { code }, user }) => {
            if (user?.canApprove !== true) {
              throw new NotFoundError();
            }
            const mod = await prisma.mod.findFirst({
              where: {
                code
              }
            });
            if (!mod) {
              throw new NotFoundError();
            }
            await prisma.mod.update({
              where: {
                id: mod.id,
              },
              data: {
                isApproved: true,
              },
            });
            return { approved: true, message: 'Mod approved.' };
        }, {
            response: t.Object({
              approved: t.Boolean(),
              message: t.String(),
            }),
        }
    )