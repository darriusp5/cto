import jwt from 'jsonwebtoken';
import type { JwtPayload, Role } from '../types';
export const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret_key';
export const JWT_EXPIRES_IN = '7d';
export const signToken = (payload: JwtPayload): string => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
export const verifyToken = (token: string): JwtPayload => jwt.verify(token, JWT_SECRET) as JwtPayload;
export type { JwtPayload, Role };
