import express from 'express';
import { z } from 'zod';
import {
  text, optionalText, httpUrl, optionalHttpUrl, optionalAssetRef, dateOnly, optionalDate, sortOrder,
} from '../../lib/validators.js';
import { crudRouter } from './crud.js';

const dateRange = (d) => !d.endDate || d.endDate >= d.startDate;
const dateRangeIssue = { message: 'End date must be on or after the start date', path: ['endDate'] };

const LinkSchema = z.strictObject({
  label: text(40),
  url: httpUrl,
  kind: z.enum(['button', 'highlight', 'github']),
});

const ProjectSchema = z.strictObject({
  title: text(120),
  description: text(2000, { multiline: true }),
  techStack: z.array(text(40)).max(30),
  thumbnailUrl: optionalAssetRef,
  links: z.array(LinkSchema).max(8),
  isPublished: z.boolean().default(true),
  sortOrder,
});

const DetailSchema = z.strictObject({
  title: optionalText(160),
  url: optionalHttpUrl,
  bullets: z.array(text(600)).max(20),
});

const ExperienceSchema = z
  .strictObject({
    company: text(160),
    role: text(160),
    location: optionalText(120),
    logoUrl: optionalAssetRef,
    startDate: dateOnly,
    endDate: optionalDate,
    details: z.array(DetailSchema).max(10),
    showProgress: z.boolean().default(false),
    isPublished: z.boolean().default(true),
    sortOrder,
  })
  .refine(dateRange, dateRangeIssue);

const EducationSchema = z
  .strictObject({
    institution: text(160),
    degree: optionalText(200),
    location: optionalText(120),
    logoUrl: optionalAssetRef,
    startDate: dateOnly,
    endDate: optionalDate,
    gpa: optionalText(20),
    bullets: z.array(text(300)).max(10),
    isPublished: z.boolean().default(true),
    sortOrder,
  })
  .refine(dateRange, dateRangeIssue);

const SkillSchema = z.strictObject({
  category: text(60),
  name: text(60),
  proficiency: optionalText(40),
  iconUrl: optionalAssetRef,
  isPublished: z.boolean().default(true),
  sortOrder,
});

const router = express.Router();
router.use('/projects', crudRouter({ model: 'project', entity: 'project', schema: ProjectSchema, labelField: 'title' }));
router.use('/experience', crudRouter({ model: 'experience', entity: 'experience', schema: ExperienceSchema, labelField: 'company' }));
router.use('/education', crudRouter({ model: 'education', entity: 'education', schema: EducationSchema, labelField: 'institution' }));
router.use('/skills', crudRouter({ model: 'skill', entity: 'skill', schema: SkillSchema, labelField: 'name', newItemAt: 'end' }));

export default router;
