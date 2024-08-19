import { Elysia, NotFoundError, t } from 'elysia';
import sizeOf from "image-size";

import { prisma } from '../../services/prisma';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validateModDescription, validateModName, validateModShortDescription } from '../../shared/validation';
import { ValidationError } from '../../errors/validation';
import { uploadFile } from '../../services/files';


const ALLOWED_RESOLUTIONS = [
  { width: 2560, height: 1440 },
  { width: 1080, height: 608 }
];

export const router = new Elysia()
    .use(authMiddleware({ loggedOnly: true }))
    .patch(
        '/api/mods/:code/details',
        async ({ params: { code }, body: { name, description, shortDescription, isNSFW, modThumbnail }, user }) => {
          return await prisma.$transaction(async (tx) => {
            const mod = await tx.mod.findFirst({
              where: {
                code
              }
            });
            if (!mod) {
              throw new NotFoundError();
            }
            if (mod.userId !== user?.id) {
              throw new ValidationError([{ field: 'user', message: "You are not the owner of this mod." }])
            }

            const errors = []

            if (name) errors.push(...validateModName(name));
            if (description) errors.push(...validateModDescription(description));
            if (shortDescription) errors.push(...validateModShortDescription(shortDescription));

            if (errors.length > 0) {
              throw new ValidationError(errors)
            }

            await tx.mod.update({
              where: {
                id: mod.id,
              },
              data: {
                name,
                description,
                shortDescription,
                isNSFW: isNSFW ? isNSFW === 'true' : undefined,
              },
            })

            if (modThumbnail) {
              const ext = modThumbnail.name.split('.').pop()
              
              const modThumbnailBuffer = await modThumbnail.arrayBuffer();

              const dimensions = sizeOf(new Uint8Array(modThumbnailBuffer));
    
              if (!ALLOWED_RESOLUTIONS.find((res) => res.width === dimensions.width && res.height === dimensions.height)) {
                errors.push({ field: 'modThumbnail', message: "Invalid thumbnail resolution" })
              }

              const thumbnailFilename = await uploadFile(modThumbnailBuffer, `${mod.slug}_thumbnail.${ext}`);

              if (thumbnailFilename) {
                await tx.modImage.deleteMany({
                  where: {
                    modId: mod.id,
                    isThumbnail: true,
                  }
                })
                await tx.modImage.create({
                  data: {
                    url: `${Bun.env.FILE_DOWNLOAD_ENDPOINT}/${thumbnailFilename}`,
                    isPrimary: false,
                    isThumbnail: true,
                    modId: mod.id
                  }
                })
              }
            }

            return await tx.mod.findFirst({ where: { id: mod.id } })
          })
        }, {
            body: t.Object({
              name: t.Optional(t.String()),
              description: t.Optional(t.String()),
              shortDescription: t.Optional(t.String()),
              isNSFW: t.Optional(t.String()),
              modThumbnail: t.Optional(t.File({ type: 'image/png', minSize: 1, maxSize: 8 * 1024 * 1024 })),
            }),
        }
    )