import { Elysia, NotFoundError, t } from 'elysia';
import { prisma } from '../../services/prisma';
import { gameMiddleware } from '../../middlewares/game.middleware';

export const router = new Elysia()
    .use(gameMiddleware())
    .get(
        '/api/game',
        async ({ gameId }) => {
            const game = await prisma.game.findFirst({
                where: {
                    id: gameId
                },
                include: {
                    modLoaders: true,
                    footerRelatedSitesCategory: {
                        include: {
                            gameRelatedSites: true
                        }
                    }
                }
            })
            if (!game) {
                throw new NotFoundError();
            }
            return game;
        },
        {
            query: t.Object({
                domain: t.String()
            })
        }
    );
