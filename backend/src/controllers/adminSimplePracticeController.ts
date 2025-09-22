import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';

const prisma = new PrismaClient();

const schema = Joi.object({
  title: Joi.string().min(3).max(120).required(),
  // array of types in request; stored as CSV string
  types: Joi.alternatives().try(
    Joi.array().items(Joi.string().min(2).max(40)).min(1),
    Joi.string().min(2)
  ).required(),
  duration: Joi.number().integer().min(1).max(600).required(),
  level: Joi.string().valid('Beginner','Intermediate','Advanced').required(),
  approach: Joi.string().valid('western','eastern','hybrid').required(),
  description: Joi.string().allow('', null),
  audioUrl: Joi.string().uri().allow(null,'').optional(),
  videoUrl: Joi.string().uri().allow(null,'').optional(),
  youtubeUrl: Joi.string().uri().allow(null,'').optional(),
  thumbnailUrl: Joi.string().uri().allow(null,'').optional(),
  tags: Joi.alternatives().try(
    Joi.array().items(Joi.string().min(1).max(40)),
    Joi.string().allow('')
  ).optional(),
  isPublished: Joi.boolean().optional()
});

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { approach, level, search, type, minDuration, maxDuration, tag } = req.query;
    const where: any = {};
    if (approach) where.approach = approach;
    if (level) where.level = level;
    if (type) where.types = { contains: type as string };
    if (tag) where.tags = { contains: tag as string, mode: 'insensitive' };
    if (minDuration || maxDuration) {
      where.duration = {};
      if (minDuration) where.duration.gte = parseInt(minDuration as string,10);
      if (maxDuration) where.duration.lte = parseInt(maxDuration as string,10);
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } }
      ];
    }
    const practices = await prisma.practice.findMany({ where, orderBy: { createdAt: 'desc' } });
    return res.json({ success: true, data: practices });
  } catch (e) { return next(e); }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const practice = await prisma.practice.findUnique({ where: { id: req.params.id } });
    if (!practice) return res.status(404).json({ success: false, error: 'Not found' });
    return res.json({ success: true, data: practice });
  } catch (e) { return next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ success: false, error: 'Validation failed', details: error.details });
    const data = transformInput(value);
    const created = await prisma.practice.create({ data });
    return res.status(201).json({ success: true, data: created });
  } catch (e) { return next(e); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const { error, value } = schema.min(1).validate(req.body, { abortEarly: false, presence: 'optional' });
    if (error) return res.status(400).json({ success: false, error: 'Validation failed', details: error.details });
    const existing = await prisma.practice.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, error: 'Not found' });
    const data = transformInput(value);
    const updated = await prisma.practice.update({ where: { id: req.params.id }, data });
    return res.json({ success: true, data: updated });
  } catch (e) { return next(e); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const existing = await prisma.practice.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, error: 'Not found' });
    await prisma.practice.delete({ where: { id: req.params.id } });
    return res.json({ success: true, data: { id: req.params.id } });
  } catch (e) { return next(e); }
}

// Helpers
function transformInput(value: any) {
  const out: any = { ...value };
  if (Array.isArray(out.types)) out.types = out.types.join(',');
  if (Array.isArray(out.tags)) out.tags = out.tags.join(',');
  // Derive single type & difficulty aliases
  if (out.types && !out.type) {
    out.type = (out.types as string).split(',')[0];
  }
  if (out.level && !out.difficulty) out.difficulty = out.level;
  return out;
}
