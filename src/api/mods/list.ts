import { Elysia, t } from 'elysia'

import { prisma } from '../../services/prisma';
import { timeAgo } from '../../shared/time-ago';
import { authMiddleware } from '../../middlewares/auth.middleware';


export const router = new Elysia()
    .use(authMiddleware({ loggedOnly: false }))
    .get(
        '/api/mods',
        async ({ query: { page, limit, search, user_slug, favorites_of_user_slug, approved, nsfw, orderby, category }, user }) => {
            const query_stringified = JSON.stringify({ page, limit, search, user_slug, favorites_of_user_slug, approved, nsfw, orderby, category, user });
            const meta = {
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 10,
            }
            const where: any = {};

            if (search) {
                where.OR = [
                    {
                        name: {
                            contains: search,
                            mode: "insensitive",
                        }
                    },
                    {
                        description: {
                            contains: search,
                            mode: "insensitive",
                        }
                    },
                    {
                        user: {
                            name: {
                                contains: search,
                                mode: "insensitive",
                            }
                        }
                    }
                ]
            }
            if (user_slug) {
                where.user = {
                    slug: user_slug,
                }
            }
            if (favorites_of_user_slug) {
                where.favorites = {
                    some: {
                        user: {
                            slug: favorites_of_user_slug,
                        }
                    }
                }
            }

            where.isApproved = approved && (approved === "true");

            if (category) {
                where.category = {
                    slug: category,
                }
            }

            where.isNSFW = nsfw === "true";

            const orderBy: any = {}
            switch (orderby) {
                case "popular":
                    orderBy["favorites"] = { _count: 'desc' }
                    break;
                case "unpopular":
                    orderBy["favorites"] = { _count: 'asc' }
                    break;
                case "oldest":
                    orderBy["lastReleasedAt"] = "asc"
                    break;
                case "newest":
                default:
                    orderBy["lastReleasedAt"] = "desc"
                    break;
            }

            const mods = await prisma.mod.findMany({
                where: where,
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
                },
                orderBy,
                take: meta.limit,
                skip: (meta.page - 1) * meta.limit,
            })

            const total_count = await prisma.mod.count({ where });
            const number_of_pages = Math.ceil(total_count / meta.limit);
            const next_page = (meta.page + 1 <= number_of_pages ? meta.page + 1 : number_of_pages);
            const prev_page = (meta.page - 1 > 0 ? meta.page - 1 : 1);

            const returnMeta = {
                total: total_count,
                page: meta.page,
                limit: meta.limit,
                pages: number_of_pages,
                next_page: next_page,
                prev_page: prev_page,
            }

            const returnMods = mods.map(mod => {
                const thumbnail_url = mod?.images
                    ?.find((image) => image.isThumbnail)?.url
                    ?? mod.images?.[0]?.url
                    ?? "https://via.placeholder.com/1080x608/222/222";
            
                const primary_imageUrl = mod?.images
                    ?.find((image) => image.isPrimary)?.url
                    ?? mod.images?.[0]?.url
                    ?? "https://via.placeholder.com/1080x608/222/222";

                const latest_version = mod.versions?.find((version) => version.isLatest);

                const downloads_arr = mod.versions?.flatMap(version => version.downloads.map(download => download.ip)) ?? [];

                const downloads = [...new Set(downloads_arr)].length;

                const favorites = mod._count.favorites;

                const total_downloads = downloads_arr.length;

                const time_ago = timeAgo(mod.lastReleasedAt);

                const last_week_downloads = [...new Set(mod.versions?.flatMap(version => {
                    return version.downloads
                        .filter(download => download.createdAt > new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)) // 7 days
                        .map(download => download.ip)
                }) ?? [])].length;

                return {
                    code: mod.code,
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
                    favorites,
                    total_downloads,
                    last_week_downloads,
                    time_ago,
                }
            })

            const result = { mods: returnMods, meta: returnMeta };

            return result;
        }, {
            query: t.Object({
                page: t.Optional(t.String()),
                limit: t.Optional(t.String()),
                search: t.Optional(t.String()),
                user_slug: t.Optional(t.String()),
                favorites_of_user_slug: t.Optional(t.String()),
                nsfw: t.Optional(t.String()),
                approved: t.Optional(t.String()),
                orderby: t.Optional(t.String()),
                category: t.Optional(t.String()),
            }),
        }
    )