import{Router}from'express';import{prisma}from'../lib/prisma';const r=Router();r.get('/',async(_req,res)=>res.json(await prisma.template.findMany({orderBy:{createdAt:'desc'}})));export default r;
