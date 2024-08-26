import { Elysia } from 'elysia';
import { prisma } from "../services/prisma";
import { UnauthorizedError } from '../errors/auth';

export const gameMiddleware = () => new Elysia()
    .derive({ as: 'global' }, async ({ request: { headers } }) => {
        const domain = headers.get('domain') || "";
        const game = await prisma.game.findFirst({
            where: {
                domain
            },
            select: {
                id: true
            }
        })
        if (!game) {
            throw new UnauthorizedError("Unauthorized, unrecognized game domain");
        }
        return {
            gameId: game.id
        };
    });
