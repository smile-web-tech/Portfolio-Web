import express from 'express';
import { prisma } from '../db.js';
import { z } from 'zod';

const router = express.Router();

const SettingsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  jobTitle: z.string().min(1, 'Job Title is required'),
  bio: z.string().nullable().optional(),
  profilePicUrl: z.string().url().nullable().optional().or(z.literal('')),
  resumeUrl: z.string().url().nullable().optional().or(z.literal('')),
  githubUrl: z.string().url().nullable().optional().or(z.literal('')),
  linkedinUrl: z.string().url().nullable().optional().or(z.literal('')),
  twitterUrl: z.string().url().nullable().optional().or(z.literal('')),
  email: z.string().email().nullable().optional(),
});

// GET general settings
router.get('/', async (req, res) => {
  try {
    const settings = await prisma.generalSettings.findUnique({ where: { id: 1 } });
    if (!settings) return res.status(404).json({ error: 'Settings not initialized' });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT update general settings
router.put('/', async (req, res) => {
  try {
    const data = SettingsSchema.parse(req.body);
    const settings = await prisma.generalSettings.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data }
    });
    res.json(settings);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues });
    }
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
