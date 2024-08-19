import { Elysia } from 'elysia';
import { readdir } from 'node:fs/promises';

export const router = async (app: Elysia) => {
	const folders = await readdir('./src/api');
	for (const folder of folders) {
		const files = await readdir(`./src/api/${folder}`);
		for (const file of files) {
			const { router } = await import(`./api/${folder}/${file}`);
			if (!router) continue;
			console.log(`Loading route: ${folder}/${file}`);
			app.group('', app => app.use(router));
		}
	}
	return app;
};
