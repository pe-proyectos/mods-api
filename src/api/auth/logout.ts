import { Elysia, t } from 'elysia';
import { prisma } from '../../services/prisma';
import { authMiddleware } from '../../middlewares/auth.middleware';

export const router = new Elysia()
	.use(authMiddleware({ loggedOnly: true }))
	.post(
		'/api/auth/logout',
		async ({ token }) => {
            if (!token) {
                return { logged_out: false };
            }
			await prisma.token.deleteMany({
				where: {
					OR: [
						{
							expiresAt: {
								lt: new Date(),
							},
						},
						{
							token,
						},
					],
				},
			});

			return { logged_out: true };
		},
		{
			response: t.Object({
				logged_out: t.Boolean(),
			}),
		},
	);
