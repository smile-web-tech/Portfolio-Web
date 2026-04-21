import express from 'express';
import { prisma } from '../db.js';
import { z } from 'zod';

const router = express.Router();

const ProjectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  techStack: z.array(z.string()),
  liveDemoUrl: z.string().url().optional().or(z.literal('')),
  githubRepoUrl: z.string().url().optional().or(z.literal('')),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  isFeatured: z.boolean().default(false),
});

// GET all projects
router.get('/', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET single project
router.get('/:id', async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id }
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// POST new project
router.post('/', async (req, res) => {
  try {
    const data = ProjectSchema.parse(req.body);
    const project = await prisma.project.create({ data });
    res.status(201).json(project);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues });
    }
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT update project
router.put('/:id', async (req, res) => {
  try {
    const data = ProjectSchema.parse(req.body);
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data
    });
    res.json(project);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues });
    }
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE project
router.delete('/:id', async (req, res) => {
  try {
    await prisma.project.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
