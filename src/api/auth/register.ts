import { Elysia, t } from 'elysia';
import slugify from 'slugify';
import { validateEmail, validateUsername, validatePassword } from '../../shared/validation';
import { ValidationError } from '../../errors/validation';
import { prisma } from '../../services/prisma';

export const router = new Elysia()
	.post(
		'/api/auth/register',
		async ({ body: { email, username, password, confirm_password } }) => {
			const errors = [];

			errors.push(...validateEmail(email));
			errors.push(...validateUsername(username));
			errors.push(...validatePassword(password, confirm_password));

			if (errors.length > 0) {
				throw new ValidationError(errors);
			}

			const existingUser = await prisma.user.findFirst({
				where: {
					email: {
						equals: email,
						mode: 'insensitive',
					},
				},
			});
			if (existingUser) {
				throw new ValidationError([{ field: 'email', message: 'User with this email already exists' }]);
			}

			const existingUserName = await prisma.user.findFirst({
				where: { name: username },
			});
			if (existingUserName) {
				throw new ValidationError([{ field: 'username', message: 'User with this name already exists' }]);
			}

			const slug = slugify(username, { lower: true }).trim();
			const existingUserSlug = await prisma.user.findFirst({ where: { slug } });
			if (existingUserSlug) {
				throw new ValidationError([{ field: 'username', message: 'User with this name/slug already exists' }]);
			}

			const hashedPassword = await Bun.password.hash(password);

			await prisma.user.create({
				data: {
					email,
					password: hashedPassword,
					name: username,
					slug,
				},
			});

			return { registered: true };
		},
		{
			body: t.Object({
				email: t.String(),
				username: t.String(),
				password: t.String(),
				confirm_password: t.String(),
			}),
			response: t.Object({
				registered: t.Boolean(),
			}),
		},
	);
