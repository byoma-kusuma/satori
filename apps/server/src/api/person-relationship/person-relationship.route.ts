import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { HTTPException } from 'hono/http-exception';

import { auth } from '../../lib/auth';
import { authenticated } from '../../middlewares/session';
import { requirePermission } from '../../middlewares/authorization';
import {
  createRelationship,
  deleteRelationship,
  getRelationshipById,
  getRelationshipsForPerson,
  updateRelationship,
} from './person-relationship.service';
import { RELATIONSHIP_TYPES } from './person-relationship.types';

const relationshipInputSchema = z.object({
  personId: z.string().uuid('Invalid person ID'),
  relatedPersonId: z.string().uuid('Invalid related person ID'),
  relationshipType: z.enum(RELATIONSHIP_TYPES, { errorMap: () => ({ message: 'Invalid relationship type' }) }),
});

const relationshipUpdateSchema = z
  .object({
    relatedPersonId: z.string().uuid('Invalid related person ID').optional(),
    relationshipType: z.enum(RELATIONSHIP_TYPES, { errorMap: () => ({ message: 'Invalid relationship type' }) }).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update.',
  });

const querySchema = z.object({
  personId: z.string().uuid('Invalid person ID'),
});

const paramsSchema = z.object({
  id: z.string().uuid('Invalid relationship ID'),
});

const relationships = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

relationships.onError((err, c) => {
  console.error('[PersonRelationshipRoute] Error:', err);

  if (err instanceof z.ZodError) {
    return c.json({
      success: false,
      message: 'Validation failed',
      errors: err.errors,
    }, 400);
  }

  if (err instanceof HTTPException) {
    return c.json({
      success: false,
      message: err.message,
    }, err.status);
  }

  return c.json({ success: false, message: 'Internal server error' }, 500);
});

const requireUser = (user: typeof auth.$Infer.Session.user | null) => {
  if (!user) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  return user;
};

export const personRelationshipRoutes = relationships
  .use('*', authenticated)
  .get('/', zValidator('query', querySchema), requirePermission('canViewPersons'), async (c) => {
    const { personId } = c.req.valid('query');
    const relationships = await getRelationshipsForPerson(personId);
    return c.json(relationships);
  })
  .get('/:id', zValidator('param', paramsSchema), requirePermission('canViewPersons'), async (c) => {
    const { id } = c.req.valid('param');
    const relationship = await getRelationshipById(id);
    return c.json(relationship);
  })
  .post('/', zValidator('json', relationshipInputSchema), requirePermission('canEditPersons'), async (c) => {
    const payload = c.req.valid('json');
    const user = requireUser(c.get('user'));

    const relationship = await createRelationship(payload, user.id);
    return c.json(relationship, 201);
  })
  .put(
    '/:id',
    zValidator('param', paramsSchema),
    zValidator('json', relationshipUpdateSchema),
    requirePermission('canEditPersons'),
    async (c) => {
      const { id } = c.req.valid('param');
      const payload = c.req.valid('json');
      const user = requireUser(c.get('user'));

      const relationship = await updateRelationship(id, payload, user.id);
      return c.json(relationship);
    },
  )
  .delete('/:id', zValidator('param', paramsSchema), requirePermission('canEditPersons'), async (c) => {
    const { id } = c.req.valid('param');
    requireUser(c.get('user'));

    await deleteRelationship(id);
    return c.json({ success: true });
  });
