import express from 'express';
import { z } from 'zod';
import { prisma } from '../../db.js';
import { audit } from '../../lib/audit.js';
import {
  text, optionalText, optionalEmail, optionalPhone, optionalHttpUrl, optionalAssetRef,
} from '../../lib/validators.js';

const router = express.Router();

const SettingsSchema = z.strictObject({
  name: text(100),
  jobTitle: text(150),
  bio: optionalText(3000, { multiline: true }),
  email: optionalEmail,
  phone: optionalPhone,
  profilePicUrl: optionalAssetRef,
  heroBackgroundUrl: optionalAssetRef,
  aboutImageUrl: optionalAssetRef,
  resumeUrl: optionalAssetRef,
  githubUrl: optionalHttpUrl,
  linkedinUrl: optionalHttpUrl,
  twitterUrl: optionalHttpUrl,
  footerCredit: optionalText(200),
});

router.get('/', async (req, res) => {
  res.json(await prisma.generalSettings.findUnique({ where: { id: 1 } }));
});

router.put('/', async (req, res) => {
  const data = SettingsSchema.parse(req.body);
  const settings = await prisma.generalSettings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  await audit(req, 'settings.update', { entity: 'settings' });
  res.json(settings);
});

export default router;
