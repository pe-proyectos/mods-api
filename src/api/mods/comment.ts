import { Elysia, NotFoundError, t } from 'elysia'

import { prisma } from '../../services/prisma';
import { authMiddleware } from '../../middlewares/auth.middleware'
import { ValidationError } from '../../errors/validation';
import { sanitizeInput } from '../../shared/sanitize';
import { timeAgo } from '../../shared/time-ago';


export const router = new Elysia()
    .use(authMiddleware({ loggedOnly: false }))
    .post(
        '/api/comment',
        async ({ request, body: { code, message }, query: { ip }, user }) => {
            if (user?.canApprove !== true) {
              throw new NotFoundError();
            }
            const mod = await prisma.mod.findFirst({
              where: {
                code
              }
            });
            if (!mod) {
              throw new NotFoundError();
            }
            const sanitizedMessage = sanitizeInput(message);
            if (!sanitizedMessage) {
                throw new ValidationError([{ field: 'message', message: "Message cant be empty" }]);
            }
            if (sanitizedMessage.length > 500) {
                throw new ValidationError([{ field: 'message', message: "Message cant be longer than 500 characters" }]);
            }
            if (sanitizedMessage.length < 2) {
                throw new ValidationError([{ field: 'message', message: "Message cant be shorter than 2 characters" }]);
            }
            const comment = await prisma.comment.create({
              data: {
                ip: (ip + "") || ("" + request.headers.get("x-forwarded-for")),
                message: sanitizedMessage,
                modId: mod.id,
                userId: user?.id ?? undefined,
                isHidden: false,
              },
            });
            return { 
                id: comment.id,
                message: comment.message,
                createdAgo: timeAgo(comment.createdAt),
                createdAt: comment.createdAt.toISOString(),
                isHidden: comment.isHidden
            };
        }, {
            body: t.Object({
                code: t.String(),
                message: t.String()
            }),
            response: t.Object({
                id: t.Number(),
                message: t.String(),
                createdAgo: t.String(),
                createdAt: t.String(),
                isHidden: t.Boolean()
            }),
        }
    )