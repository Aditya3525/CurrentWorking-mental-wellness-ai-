import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';

const prisma = new PrismaClient();

const schema = Joi.object({
  title: Joi.string().min(3).max(160).required(),
  description: Joi.string().allow('', null),
  contentType: Joi.string().valid('audio','video','story','article').required(),
  category: Joi.string().min(2).max(60).optional(),
  approach: Joi.string().valid('western','eastern','hybrid','all').required(),
  body: Joi.string().allow('', null),
  duration: Joi.string().max(32).allow('', null),
  difficulty: Joi.string().valid('Beginner','Intermediate','Advanced').allow('', null),
  audioUrl: Joi.string().uri().allow('', null),
  videoUrl: Joi.string().uri().allow('', null),
  youtubeUrl: Joi.string().uri().allow('', null),
  thumbnailUrl: Joi.string().uri().allow('', null),
  tags: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
  isPublished: Joi.boolean().optional()
});

function normalize(v:any){
  const out:any={...v};
  if(Array.isArray(out.tags)) out.tags=out.tags.join(',');
  if(typeof out.tags==='string') out.tags = out.tags.split(',').map((s:string)=>s.trim()).filter(Boolean).join(',');
  return out;
}

export async function list(req:Request,res:Response,next:NextFunction){
  try {
  const { approach, contentType, search, category } = req.query;
    const where:any={};
    if(approach) where.approach=approach;
    if(contentType) where.type=contentType;
  if(category) where.category=category;
    if(search){
      where.OR=[
        { title:{ contains:search, mode:'insensitive'}},
        { description:{ contains:search, mode:'insensitive'}},
        { content:{ contains:search, mode:'insensitive'}},
        { tags:{ contains:search, mode:'insensitive'}}
      ];
    }
    const items = await prisma.content.findMany({ where, orderBy:{ createdAt:'desc'} });
    res.json({ success:true, data: items });
  } catch(e){ next(e); }
}

export async function get(req:Request,res:Response,next:NextFunction){
  try {
    const item = await prisma.content.findUnique({ where:{ id:req.params.id }});
    if(!item) return res.status(404).json({ success:false, error:'Not found'});
    return res.json({ success:true, data:item});
  } catch(e){ return next(e); }
}

export async function create(req:Request,res:Response,next:NextFunction){
  try {
    const { error, value } = schema.validate(req.body,{ abortEarly:false });
    if(error) return res.status(400).json({ success:false, error:'Validation failed', details:error.details });
    const data = normalize(value);
    const created = await prisma.content.create({ data:{
      title:data.title,
      description:data.description || null,
      type:data.contentType,
      category: data.category || 'General',
      approach:data.approach,
      content: data.body || data.audioUrl || data.videoUrl || data.youtubeUrl || '',
      duration: data.duration || null,
      difficulty: data.difficulty || null,
      fileUrl: data.audioUrl || data.videoUrl || null,
      externalUrl: data.youtubeUrl || null,
      thumbnailUrl: data.thumbnailUrl || null,
      tags: data.tags || null,
      isPublished: data.isPublished ?? false
    }});
    return res.status(201).json({ success:true, data: created });
  } catch(e){ return next(e); }
}

export async function update(req:Request,res:Response,next:NextFunction){
  try {
    const { error, value } = schema.min(1).validate(req.body,{ abortEarly:false, presence:'optional' });
    if(error) return res.status(400).json({ success:false, error:'Validation failed', details:error.details });
    const existing = await prisma.content.findUnique({ where:{ id:req.params.id }});
    if(!existing) return res.status(404).json({ success:false, error:'Not found'});
    const data = normalize(value);
    const updated = await prisma.content.update({ where:{ id:req.params.id }, data:{
      title: data.title ?? existing.title,
      description: data.description ?? existing.description,
      type: data.contentType ?? existing.type,
      category: data.category ?? existing.category,
      approach: data.approach ?? existing.approach,
      content: data.body || data.audioUrl || data.videoUrl || data.youtubeUrl || existing.content,
      duration: data.duration ?? existing.duration,
      difficulty: data.difficulty ?? existing.difficulty,
      fileUrl: (data.audioUrl || data.videoUrl) ?? existing.fileUrl,
      externalUrl: data.youtubeUrl ?? existing.externalUrl,
      thumbnailUrl: data.thumbnailUrl ?? existing.thumbnailUrl,
      tags: data.tags ? data.tags : existing.tags,
      isPublished: data.isPublished ?? existing.isPublished
    }});
    return res.json({ success:true, data: updated });
  } catch(e){ return next(e); }
}

export async function remove(req:Request,res:Response,next:NextFunction){
  try {
    const existing = await prisma.content.findUnique({ where:{ id:req.params.id }});
    if(!existing) return res.status(404).json({ success:false, error:'Not found'});
    await prisma.content.delete({ where:{ id:req.params.id }});
    return res.json({ success:true, data:{ id:req.params.id }});
  } catch(e){ return next(e); }
}
