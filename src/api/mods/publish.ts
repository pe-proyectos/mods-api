import { Elysia, t } from 'elysia'
import slugify from "slugify";
import semver from 'semver';
import sizeOf from "image-size";

import { prisma } from '../../services/prisma';
import { authMiddleware } from '../../middlewares/auth.middleware'
import { validateModDescription, validateModName, validateModShortDescription } from '../../shared/validation';
import { ValidationError } from '../../errors/validation';
import { uploadFile } from '../../services/files';
import { readManifest } from '../../shared/read-manifest';


const MOD_FILE_SIZE_LIMIT = 200 * 1024 * 1024; // 200MB
const ALLOWED_RESOLUTIONS = [
  { width: 2560, height: 1440 },
  { width: 1080, height: 608 }
]

export const router = new Elysia()
  .use(authMiddleware({ loggedOnly: true }))
  .post(
    '/api/mods/publish',
    async ({ body: { name, shortDescription, description, isNSFW, category_id, modFile, modThumbnail }, user }) => {
      const modThumbnailBuffer = await modThumbnail.arrayBuffer();
      const modFileBuffer = await modFile.arrayBuffer();

      return await prisma.$transaction(async (tx) => {
        const errors = []

        errors.push(...validateModName(name))
        errors.push(...validateModDescription(description))
        errors.push(...validateModShortDescription(shortDescription))

        if (errors.length > 0) {
          throw new ValidationError(errors)
        }

        const dimensions = sizeOf(new Uint8Array(modThumbnailBuffer));

        if (!ALLOWED_RESOLUTIONS.find((res) => res.width === dimensions.width && res.height === dimensions.height)) {
          throw new ValidationError([{ field: 'modThumbnail', message: "Invalid thumbnail resolution" }])
        }

        if ((modFileBuffer.byteLength / 1024) > MOD_FILE_SIZE_LIMIT) {
          throw new ValidationError([{ field: 'modFile', message: "Mod file size exceeds the limit of 200MB." }])
        }

        const ext = modFile.name.split('.').pop()
        if (ext !== 'zip') {
          throw new ValidationError([{ field: 'modFile', message: "Mod file must be a zip file." }])
        }

        const { id: code, version, dependencies, type } = readManifest(modFileBuffer);

        if (code.includes(" ")) {
          throw new ValidationError([{ field: 'modFile', message: "Mod id cannot contain spaces in manifest.json" }])
        }

        if (type !== "Mod" && type !== "Library") {
          throw new ValidationError([{ field: 'modFile', message: "Invalid mod type provided in manifest.json, must be Mod or Library" }])
        }

        if (!semver.valid(version)) {
          throw new ValidationError([{ field: 'modFile', message: "Invalid mod version provided in manifest.json" }])
        }

        const slug = slugify(name, { lower: true });

        const [existingName, existingSlug, existingCode] = await Promise.all([
          tx.mod.findFirst({ select: { id: true }, where: { name } }),
          tx.mod.findFirst({ select: { id: true }, where: { slug } }),
          tx.mod.findFirst({ select: { id: true }, where: { code } }),
        ]);

        if (existingName || existingSlug || existingCode) {
          throw new ValidationError([{ field: 'name', message: "Mod already exists. Try a different mod name and manifest.json" }]);
        }

        const mod = await tx.mod.create({
          data: {
            code,
            name,
            slug,
            shortDescription,
            description,
            dependencies,
            type,
            isNSFW: isNSFW === "true",
            isApproved: false,
            isFeatured: false,
            categoryId: parseInt(category_id),
            userId: user?.id,
          }
        })


        let thumbnailFilename;
        try {
          const ext = modThumbnail.name.split('.').pop()
          thumbnailFilename = await uploadFile(modThumbnailBuffer, `${slug}_thumbnail.${ext}`)
          if (!thumbnailFilename) throw thumbnailFilename;
        } catch (error) {
          console.error("Error uploading thumbnail:", error)
          throw new ValidationError([{ field: 'modThumbnail', message: "An error occurred during thumbnail upload." }])
        }

        await tx.modImage.create({
          data: {
            url: `${Bun.env.FILE_DOWNLOAD_ENDPOINT}/${thumbnailFilename}`,
            isPrimary: false,
            isThumbnail: true,
            modId: mod.id
          }
        });

        let filename;
        try {
          filename = await uploadFile(modFileBuffer, `${slug}_${version}.${ext}`)
          if (!filename) throw filename;
        } catch (error) {
          console.error("Error uploading file:", error)
          throw new ValidationError([{ field: 'modFile', message: "An error occurred during file upload." }])
        }

        await tx.modVersion.create({
          data: {
            version,
            changelog: "First release",
            downloadUrl: `${Bun.env.FILE_DOWNLOAD_ENDPOINT}/${filename}`,
            isLatest: true,
            filename,
            extension: ext,
            modId: mod.id
          }
        })

        return mod;
      })
    }, {
    body: t.Object({
      name: t.String(),
      shortDescription: t.String(),
      description: t.String(),
      isNSFW: t.String(),
      category_id: t.String(),
      modFile: t.File({ minSize: 1, maxSize: MOD_FILE_SIZE_LIMIT }),
      modThumbnail: t.File({ type: 'image/png', minSize: 1, maxSize: 8 * 1024 * 1024 }),
    }),
  }
  )
