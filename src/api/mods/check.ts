import { Elysia, NotFoundError, t } from 'elysia'
import semver from 'semver';

import { prisma } from '../../services/prisma';


export const router = new Elysia()
    .get(
        '/api/mods/:code/check',
        async ({ params: { code }, query: { version } }) => {
            const latestVersion = await prisma.modVersion.findFirst({
              where: {
                mod: {
                  id: Number.parseInt(code)
                },
                isLatest: true,
              },
              select: {
                version: true,
                changelog: true,
              }
            });
            if (!latestVersion) {
              throw new NotFoundError();
            }
            if (version) {
              if (semver.gt(latestVersion.version, version)) {
                return {
                  newVersionAvailable: true,
                  message: 'New version available',
                  version: latestVersion.version,
                  changelog: latestVersion.changelog,
                };
              } else {
                return {
                  newVersionAvailable: false,
                  message: 'No new version available',
                  version: latestVersion.version,
                  changelog: latestVersion.changelog,
                };
              }
            }
            return {
              newVersionAvailable: false,
              message: 'Latest version',
              version: latestVersion.version,
              changelog: latestVersion.changelog
            };
        }, {
            query: t.Object({
                version: t.Optional(t.String()),
            }),
            response: t.Object({
                newVersionAvailable: t.Boolean(),
                message: t.String(),
                version: t.String(),
                changelog: t.String(),
            }),
        }
    )