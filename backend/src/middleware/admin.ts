import type { RequestHandler } from 'express';
import { prisma } from '../lib/prisma';
import type { AuthRequest } from '../types';
export const requireAdmin: RequestHandler = async (req,res,next) => { const u=(req as AuthRequest).user; if(!u){res.status(401).json({error:'Требуется авторизация'});return;} const user=await prisma.user.findUnique({where:{id:u.sub}}); if(!user || user.banned || user.role !== 'admin'){res.status(403).json({error:'Доступ только администраторам'});return;} next(); };
