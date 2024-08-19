import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';

import { router } from './router';
import { errorHandler } from './handlers/error.handler';
import { loggerPlugin } from './plugins/logger.plugin';

const app = new Elysia()
	.use(swagger())
	.use(cors({
		origin: true,
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		allowedHeaders: '*',
		credentials: true,
	}))
	.use(loggerPlugin)
	.use(errorHandler)
	.use(router)
	.listen(Bun.env.PORT ?? 3000);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);