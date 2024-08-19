import { Elysia } from 'elysia';
import { prisma } from "../services/prisma";
import { UnauthorizedError } from '../errors/auth';

export const authMiddleware = (opts: { loggedOnly: boolean }) => new Elysia()
    .derive({ as: 'scoped' }, async ({ request: { headers } }) => {
        const token = headers.get('Authorization')?.split('Bearer ')[1]
        const user = await prisma.user.findFirst({
            where: {
                tokens: {
                    some: {
                        token,
                    }
                }
            }
        })
        if (token && user) return { token, user };
        else if (opts.loggedOnly) throw new UnauthorizedError("Unauthorized, login required");
        else return { token: null, user: null };
    });
