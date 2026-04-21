import express from 'express';
import { prisma } from '../db.js';
import { z } from 'zod';

const router = express.Router();

const ExperienceSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  role: z.string().min(1, 'Role is required'),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().nullable().optional().transform((str) => str ? new Date(str) : null),
  description: z.string().min(1, 'Description is required'),
});

router.get('/', async (req, res) => {
  try {
    const data = await prisma.experience.findMany({ orderBy: { startDate: 'desc' } });
    res.json(data);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch experience' }); }
});

router.post('/', async (req, res) => {
  try {
    const data = ExperienceSchema.parse(req.body);
    const result = await prisma.experience.create({ data });
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.issues });
    res.status(500).json({ error: 'Failed' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = ExperienceSchema.parse(req.body);
    const result = await prisma.experience.update({ where: { id: req.params.id }, data });
    res.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.issues });
    res.status(500).json({ error: 'Failed' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.experience.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

export default router;
