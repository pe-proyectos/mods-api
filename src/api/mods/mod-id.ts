import { Elysia, NotFoundError, t } from 'elysia'

import { prisma } from '../../services/prisma';


export const router = new Elysia()
    .get(
        '/api/mods/find',
        async ({ query: { user_slug, mod_slug } }) => {
            const mod = await prisma.mod.findFirst({
                where: {
                    slug: mod_slug,
                    user: {
                        slug: user_slug,
                    }
                },
                select: {
                    code: true,
                }
            })

            if (!mod) {
                throw new NotFoundError();
            }

            return mod;
        },
        {
            query: t.Object({
                user_slug: t.String(),
                mod_slug: t.String(),
            })
        }
    )