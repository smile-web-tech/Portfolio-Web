import express from 'express';
import { prisma } from '../db.js';
import { z } from 'zod';

const router = express.Router();

const SkillSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Name is required'),
  proficiency: z.string().nullable().optional(),
});

router.get('/', async (req, res) => {
  try {
    const data = await prisma.skill.findMany({ orderBy: { category: 'asc' } });
    res.json(data);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch skills' }); }
});

router.post('/', async (req, res) => {
  try {
    const data = SkillSchema.parse(req.body);
    const result = await prisma.skill.create({ data });
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.issues });
    res.status(500).json({ error: 'Failed' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = SkillSchema.parse(req.body);
    const result = await prisma.skill.update({ where: { id: req.params.id }, data });
    res.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.issues });
    res.status(500).json({ error: 'Failed' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.skill.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

export default router;
