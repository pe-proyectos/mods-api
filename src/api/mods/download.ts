import { Elysia, NotFoundError } from 'elysia'

import { prisma } from '../../services/prisma';


export const router = new Elysia()
    .get(
        '/api/mods/:code/download/:version',
        async ({ request, params: { code, version }, query: { ip, agent }, set }) => {
            const mod = await prisma.mod.findFirst({
                where: {
                    code,
                    versions: {
                        some: {
                            version,
                        }
                    }
                },
                select: {
                    name: true,
                    versions: {
                        where: {
                            version,
                        },
                        select: {
                            id: true,
                            version: true,
                            extension: true,
                            downloadUrl: true,
                        }
                    }
                }
            });
            if (!mod) {
              throw new NotFoundError();
            }
            const modVersion = mod?.versions[0];
            if (!modVersion) {
              throw new NotFoundError();
            }
            const f = await fetch(modVersion.downloadUrl);
            const blob = await f.blob();

            prisma.modDownload.create({
                data: {
                    ip: (ip + "") || ("" + request.headers.get("x-forwarded-for")),
                    userAgent: (agent + "") || ("" + request.headers.get("user-agent")),
                    modVersionId: modVersion.id,
                }
            }).catch(err => console.error(err));

            set.headers['Content-Type'] = "" + f.headers.get('Content-Type');
            set.headers['Content-Length'] = "" + f.headers.get('Content-Length');
            set.headers['Content-Disposition'] = `attachment; filename="${mod.name} ${modVersion.version}.${modVersion.extension}"`;

            return blob;
        }
    )