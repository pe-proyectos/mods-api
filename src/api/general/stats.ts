import { Elysia, t } from 'elysia';
import { prisma } from '../../services/prisma';

export const router = new Elysia()
    .get(
        '/api/stats',
        async () => {
            const users = await prisma.user.count()
            const mods = await prisma.mod.count()
            const downloads = await prisma.modDownload.count()
            const developers = await prisma.user.count({
                where: {
                    mods: {
                        some: {
                            isApproved: true,
                        }
                    }
                }
            })
            return {
                users,
                mods,
                downloads,
                developers,
            }
        },
    );
