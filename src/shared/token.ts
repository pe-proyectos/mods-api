import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(Bun.env.JWT_SECRET ?? 'secret');
const JWT_EXPIRATION = 60 * 60 * 24 * 2; // 2 days in seconds

export async function generateToken(userId: number) {
	const payload = {
		userId: userId,
		exp: Math.floor((Date.now() / 1000) + JWT_EXPIRATION),
	};
	const token = await new jose.SignJWT({ data: payload })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime('2d')
		.sign(JWT_SECRET);
	return token;
}

export async function verifyToken(token: string) {
	const payload = await jose.jwtVerify(token, JWT_SECRET);
	if (!payload) {
		throw new Error('Failed to verify token');
	}
	return payload;
}
