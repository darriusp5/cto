import type { RequestHandler } from 'express';
export const requireDev: RequestHandler = (_req,res,next) => { if(process.env.ALLOW_DEV_LOGIN !== 'true' || process.env.NODE_ENV === 'production'){res.status(403).json({error:'Dev-режим отключён'});return;} next(); };
