import { Elysia, t } from 'elysia'

import { prisma } from '../../services/prisma';
import { timeAgo } from '../../shared/time-ago';
import { authMiddleware } from '../../middlewares/auth.middleware';


export const router = new Elysia()
    .use(authMiddleware({ loggedOnly: false }))
    .get(
        '/api/mods/featured',
        async ({ user }) => {
            const mods = await prisma.mod.findMany({
                where: {
                    isNSFW: false,
                    isApproved: true,
                    type: "Mod",
                },
                include: {
                    images: {
                        select: {
                            isPrimary: true,
                            isThumbnail: true,
                            url: true,
                        }
                    },
                    user: {
                        select: {
                            name: true,
                            slug: true,
                            imageUrl: true,
                        }
                    },
                    category: {
                        select: {
                            name: true,
                            slug: true,
                        }
                    },
                    versions: {
                        orderBy: {
                            version: "asc",
                        },
                        include: {
                            downloads: {
                                select: {
                                    ip: true,
                                    createdAt: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            favorites: true,
                        }
                    }
                }
            })

            const allMods = mods.map(mod => {
                const thumbnail_url = mod?.images
                    ?.find((image) => image.isThumbnail)?.url
                    ?? mod.images?.[0]?.url
                    ?? "https://via.placeholder.com/1080x608/222/222";

                const primary_imageUrl = mod?.images
                    ?.find((image) => image.isPrimary)?.url
                    ?? mod.images?.[0]?.url
                    ?? "https://via.placeholder.com/1080x608/222/222";

                const latest_version = mod.versions?.find((version) => version.isLatest);

                const downloads_arr = mod.versions?.flatMap(version => {
                    return version.downloads
                        .map(download => download.ip)
                }) ?? [];

                const last_week_downloads = [...new Set(mod.versions?.flatMap(version => {
                    return version.downloads
                        .filter(download => download.createdAt > new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)) // 7 days
                        .map(download => download.ip)
                }) ?? [])].length;

                const downloads = [...new Set(downloads_arr)].length;

                const favorites = mod._count.favorites;

                const total_downloads = downloads_arr.length;

                const time_ago = timeAgo(mod.lastReleasedAt);

                return {
                    id: mod.id,
                    name: mod.name,
                    slug: mod.slug,
                    short_description: mod.shortDescription,
                    isNSFW: mod.isNSFW,
                    isApproved: mod.isApproved,
                    isFeatured: mod.isFeatured,
                    category_slug: mod?.category?.slug,
                    category_name: mod?.category?.name,
                    user_name: mod?.user?.name,
                    user_slug: mod?.user?.slug,
                    user_imageUrl: mod?.user?.imageUrl,
                    thumbnail_url,
                    primary_imageUrl,
                    dependencies: mod?.dependencies?.split(","),
                    type: mod?.type ?? "Mod",
                    latest_version: latest_version?.version,
                    downloads,
                    last_week_downloads,
                    favorites,
                    total_downloads,
                    time_ago,
                }
            })

            const result = allMods.sort((a, b) => b.last_week_downloads - a.last_week_downloads).slice(0, 4);

            return result;
        }
    )
