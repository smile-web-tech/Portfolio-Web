import express from 'express';
import { prisma } from '../db.js';
import { z } from 'zod';

const router = express.Router();

const EducationSchema = z.object({
  institution: z.string().min(1, 'Institution is required'),
  degree: z.string().min(1, 'Degree is required'),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().nullable().optional().transform((str) => str ? new Date(str) : null),
  gpa: z.string().nullable().optional(),
});

router.get('/', async (req, res) => {
  try {
    const data = await prisma.education.findMany({ orderBy: { startDate: 'desc' } });
    res.json(data);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch education' }); }
});

router.post('/', async (req, res) => {
  try {
    const data = EducationSchema.parse(req.body);
    const result = await prisma.education.create({ data });
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.issues });
    res.status(500).json({ error: 'Failed' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = EducationSchema.parse(req.body);
    const result = await prisma.education.update({ where: { id: req.params.id }, data });
    res.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.issues });
    res.status(500).json({ error: 'Failed' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.education.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

export default router;
