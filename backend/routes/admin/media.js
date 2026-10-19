import express from 'express';
import multer from 'multer';
import { prisma } from '../../db.js';
import { audit } from '../../lib/audit.js';
import { uuid } from '../../lib/validators.js';
import { processUpload } from '../../lib/uploads.js';
import { deleteFile } from '../../lib/storage.js';
import { config } from '../../config.js';
import { uploadLimiter } from '../../middleware/rateLimit.js';
import { HttpError } from '../../middleware/errors.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.storage.maxUploadBytes, files: 1, fields: 0, parts: 2 },
});

// Where a given file is referenced, so deleting it can't silently break the public site.
async function findUsages(url) {
  const [settings, projects, experience, education, skills] = await Promise.all([
    prisma.generalSettings.findFirst({
      where: { OR: ['profilePicUrl', 'heroBackgroundUrl', 'aboutImageUrl', 'resumeUrl'].map((k) => ({ [k]: url })) },
    }),
    prisma.project.findMany({ where: { thumbnailUrl: url }, select: { title: true } }),
    prisma.experience.findMany({ where: { logoUrl: url }, select: { company: true } }),
    prisma.education.findMany({ where: { logoUrl: url }, select: { institution: true } }),
    prisma.skill.findMany({ where: { iconUrl: url }, select: { name: true } }),
  ]);
  return [
    ...(settings ? ['Settings'] : []),
    ...projects.map((p) => `Project: ${p.title}`),
    ...experience.map((e) => `Experience: ${e.company}`),
    ...education.map((e) => `Education: ${e.institution}`),
    ...skills.map((s) => `Skill: ${s.name}`),
  ];
}

router.get('/', async (req, res) => {
  const items = await prisma.media.findMany({ orderBy: { createdAt: 'desc' }, take: 500 });
  res.json(items);
});

router.post('/', uploadLimiter, upload.single('file'), async (req, res) => {
  if (!req.file) throw new HttpError(400, 'No file uploaded');
  const meta = await processUpload(req.file.buffer, req.file.originalname);
  let media;
  try {
    media = await prisma.media.create({ data: meta });
  } catch (err) {
    await deleteFile(meta.url).catch(() => {});
    throw err;
  }
  await audit(req, 'media.upload', { entity: 'media', entityId: media.id, detail: media.originalName });
  res.status(201).json(media);
});

router.delete('/:id', async (req, res) => {
  const id = uuid.parse(req.params.id);
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) throw new HttpError(404, 'Not found');

  if (req.query.force !== 'true') {
    const usages = await findUsages(media.url);
    if (usages.length) throw new HttpError(409, 'File is in use', { usages });
  }
  await prisma.media.delete({ where: { id } });
  await deleteFile(media.url).catch((err) => console.error('blob delete failed:', err.message));
  await audit(req, 'media.delete', { entity: 'media', entityId: id, detail: media.originalName });
  res.json({ success: true });
});

export default router;
