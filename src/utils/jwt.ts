// Esta clase genera y verifica los JSON Web Tokens. Solo usa Acces Tokens por el momento. -KA

import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { Role } from '../models/user.model.js';

type AccessPayload = { sub: string; role: Role };

export function createAccessToken(userId: string, role: Role): string {
  return jwt.sign({ sub: userId, role }, env.jwtSecret, { 
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] 
  });
}

export function verifyAccessToken(token: string): AccessPayload {
  const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
  if (typeof payload.sub !== 'string' || !payload.role) {
    throw new Error('Invalid access token');
  }
  return { sub: payload.sub, role: payload.role as Role };
}