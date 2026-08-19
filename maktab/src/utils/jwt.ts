import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

const getKey = (secret: string) => new TextEncoder().encode(secret);

export const signToken = async (
  payload: Record<string, unknown>,
  secret: string,
  expiresIn: string = '7d'
): Promise<string> => {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getKey(secret));
};

export const verifyToken = async (
  token: string,
  secret: string
): Promise<JWTPayload | null> => {
  try {
    const { payload } = await jwtVerify(token, getKey(secret));
    return payload;
  } catch {
    return null;
  }
};
