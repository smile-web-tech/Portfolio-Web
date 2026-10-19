import express from 'express';
import { z } from 'zod';
import { prisma } from '../../db.js';
import { audit } from '../../lib/audit.js';
import { uuid } from '../../lib/validators.js';
import { HttpError } from '../../middleware/errors.js';

const ReorderSchema = z.strictObject({ ids: z.array(uuid).min(1).max(500) });

// Generic admin CRUD for an ordered content model.
//   model        Prisma delegate name
//   entity       label used in audit entries
//   schema       zod schema validating create/update bodies (strict: unknown keys are rejected)
//   labelField   field copied into the audit trail
//   newItemAt    'start' | 'end' where created items land in manual order
export function crudRouter({ model, entity, schema, labelField, newItemAt = 'start' }) {
  const router = express.Router();
  const db = prisma[model];
  const orderBy = [{ sortOrder: 'asc' }, { createdAt: 'desc' }];
  const detail = (row) => row?.[labelField];

  router.get('/', async (req, res) => {
    res.json(await db.findMany({ orderBy }));
  });

  // Must be registered before '/:id'.
  router.put('/reorder', async (req, res) => {
    const { ids } = ReorderSchema.parse(req.body);
    if (new Set(ids).size !== ids.length) throw new HttpError(400, 'Duplicate ids');
    await prisma.$transaction(ids.map((id, index) => db.update({ where: { id }, data: { sortOrder: index } })));
    await audit(req, `${entity}.reorder`, { entity, detail: `${ids.length} items` });
    res.json({ success: true });
  });

  router.get('/:id', async (req, res) => {
    const row = await db.findUnique({ where: { id: uuid.parse(req.params.id) } });
    if (!row) throw new HttpError(404, 'Not found');
    res.json(row);
  });

  router.post('/', async (req, res) => {
    const data = schema.parse(req.body);
    if (data.sortOrder === undefined) {
      const edge = await db.aggregate(newItemAt === 'start' ? { _min: { sortOrder: true } } : { _max: { sortOrder: true } });
      const current = (newItemAt === 'start' ? edge._min.sortOrder : edge._max.sortOrder) ?? 0;
      data.sortOrder = newItemAt === 'start' ? current - 1 : current + 1;
    }
    const row = await db.create({ data });
    await audit(req, `${entity}.create`, { entity, entityId: row.id, detail: detail(row) });
    res.status(201).json(row);
  });

  router.put('/:id', async (req, res) => {
    const id = uuid.parse(req.params.id);
    const data = schema.parse(req.body);
    if (data.sortOrder === undefined) delete data.sortOrder; // keep the current position
    const row = await db.update({ where: { id }, data });
    await audit(req, `${entity}.update`, { entity, entityId: id, detail: detail(row) });
    res.json(row);
  });

  router.delete('/:id', async (req, res) => {
    const id = uuid.parse(req.params.id);
    const row = await db.delete({ where: { id } });
    await audit(req, `${entity}.delete`, { entity, entityId: id, detail: detail(row) });
    res.json({ success: true });
  });

  return router;
}
