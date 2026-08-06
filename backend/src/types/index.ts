import type { Request } from 'express';
export type Role = 'user' | 'admin';
export interface JwtPayload { sub:string; phone:string; role:Role }
export interface AuthRequest extends Request { user?: JwtPayload }
export const asRecord = (value: unknown): Record<string, unknown> => (typeof value === 'object' && value !== null ? value as Record<string, unknown> : {});
