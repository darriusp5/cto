import type { RequestHandler } from 'express';
import { verifyToken } from '../lib/jwt';
import type { AuthRequest } from '../types';
export const requireAuth: RequestHandler = (req, res, next) => { const header=req.header('authorization'); if (!header?.startsWith('Bearer ')) { res.status(401).json({error:'Требуется авторизация'}); return; } try { (req as AuthRequest).user=verifyToken(header.slice(7)); next(); } catch { res.status(401).json({error:'Недействительный токен'}); } };
