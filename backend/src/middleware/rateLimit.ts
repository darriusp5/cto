import type { RequestHandler } from 'express';
const hits=new Map<string,{count:number; reset:number}>();
export const rateLimit=(max:number, windowMs:number):RequestHandler => (req,res,next)=>{const key=req.ip+req.path; const now=Date.now(); const old=hits.get(key); const h=!old||old.reset<now?{count:0,reset:now+windowMs}:old; h.count++; hits.set(key,h); if(h.count>max){res.status(429).json({error:'Слишком много запросов'});return;} next();};
