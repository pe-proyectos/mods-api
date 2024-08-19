import { Elysia, t } from 'elysia'
import semver from 'semver'

import { authMiddleware } from '../../middlewares/auth.middleware'
import { ValidationError } from '../../errors/validation'
import { readManifest } from '../../shared/read-manifest';


const MOD_FILE_SIZE_LIMIT = 200 * 1024 * 1024; // 200MB

export const router = new Elysia()
    .use(authMiddleware({ loggedOnly: true }))
    .post(
        '/api/mods/upload',
        async ({ body: { modFile } }) => {
          const file = await modFile.arrayBuffer()

          if ((file.byteLength / 1024) > MOD_FILE_SIZE_LIMIT) {
            throw new ValidationError([{ field: 'modFile', message: "Mod file size exceeds the limit of 200MB." }])
          }

          const ext = modFile.name.split('.').pop()
          if (ext !== 'zip') {
            throw new ValidationError([{ field: 'modFile', message: "Mod file must be a zip file." }])
          }

          const manifest = readManifest(file);
          
          if (!semver.valid(manifest.version)) {
            throw new ValidationError([{ field: 'modFile', message: "Invalid mod version provided." }])
          }

          if (manifest.type !== "Mod" && manifest.type !== "Library") {
            throw new ValidationError([{ field: 'modFile', message: "Invalid mod type provided in manifest.json, must be Mod or Library" }])
          }

          return {
            name: manifest?.id ?? "",
            version: manifest.version,
            description: manifest?.description ?? "",
            dependencies: manifest.dependencies?.split(","),
            type: manifest?.type,
          }
        }, {
            body: t.Object({
                modFile: t.File({ minSize: 1, maxSize: MOD_FILE_SIZE_LIMIT }),
            }),
        }
    )