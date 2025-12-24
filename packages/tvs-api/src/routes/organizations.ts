/**
 * Organization Management Routes
 *
 * Multi-tenant API for managing organizations (HOAs, companies, nonprofits, etc.)
 * that run elections on the TVS platform.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as organizationsDb from '../db/organizations.js';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const CreateOrganizationSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  type: z.enum(['hoa', 'company', 'nonprofit', 'government', 'other']).optional(),
  settings: z.record(z.unknown()).optional(),
  ownerEmail: z.string().email(),
});

const UpdateOrganizationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  type: z.enum(['hoa', 'company', 'nonprofit', 'government', 'other']).optional(),
  settings: z.record(z.unknown()).optional(),
});

const InviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['owner', 'admin', 'member']),
});

const UpdateMemberRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'member']),
});

// ============================================
// ROUTES
// ============================================

export async function organizationRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/orgs
   * Create a new organization
   */
  fastify.post('/', async (request, reply) => {
    try {
      const body = CreateOrganizationSchema.parse(request.body);

      // Check if slug is already taken
      const existingOrg = await organizationsDb.getOrganizationBySlug(body.slug);
      if (existingOrg) {
        return reply.status(409).send({
          error: 'Slug already taken',
          message: `An organization with slug "${body.slug}" already exists`,
        });
      }

      // Create organization
      const organization = await organizationsDb.createOrganization({
        name: body.name,
        slug: body.slug,
        type: body.type,
        settings: body.settings,
      });

      // Add owner as first member
      await organizationsDb.inviteMember(organization.id, body.ownerEmail, 'owner');
      await organizationsDb.markMemberJoined(organization.id, body.ownerEmail);

      return reply.status(201).send({
        organization,
        message: 'Organization created successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      throw error;
    }
  });

  /**
   * GET /api/orgs
   * List organizations for the current user
   */
  fastify.get('/', async (request, reply) => {
    try {
      // TODO: Get user email from auth session/JWT
      // For MVP, accept email as query param
      const { email } = request.query as { email?: string };

      if (!email) {
        return reply.status(400).send({
          error: 'Email required',
          message: 'User email must be provided (TODO: use auth session)',
        });
      }

      const organizations = await organizationsDb.listOrganizationsForUser(email);

      return {
        organizations,
        count: organizations.length,
      };
    } catch (error) {
      throw error;
    }
  });

  /**
   * GET /api/orgs/:id
   * Get organization details
   */
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const organization = await organizationsDb.getOrganizationWithStats(id);

      if (!organization) {
        return reply.status(404).send({
          error: 'Organization not found',
        });
      }

      return { organization };
    } catch (error) {
      throw error;
    }
  });

  /**
   * PATCH /api/orgs/:id
   * Update organization
   */
  fastify.patch('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = UpdateOrganizationSchema.parse(request.body);

      // TODO: Check user has admin/owner role for this org

      // If updating slug, check it's not taken
      if (body.slug) {
        const existingOrg = await organizationsDb.getOrganizationBySlug(body.slug);
        if (existingOrg && existingOrg.id !== id) {
          return reply.status(409).send({
            error: 'Slug already taken',
            message: `An organization with slug "${body.slug}" already exists`,
          });
        }
      }

      const organization = await organizationsDb.updateOrganization(id, body);

      if (!organization) {
        return reply.status(404).send({
          error: 'Organization not found',
        });
      }

      return {
        organization,
        message: 'Organization updated successfully',
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      throw error;
    }
  });

  /**
   * DELETE /api/orgs/:id
   * Delete organization
   */
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      // TODO: Check user has owner role for this org

      const deleted = await organizationsDb.deleteOrganization(id);

      if (!deleted) {
        return reply.status(404).send({
          error: 'Organization not found',
        });
      }

      return {
        message: 'Organization deleted successfully',
      };
    } catch (error) {
      throw error;
    }
  });

  /**
   * POST /api/orgs/:id/members
   * Invite a member to the organization
   */
  fastify.post('/:id/members', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = InviteMemberSchema.parse(request.body);

      // TODO: Check user has admin/owner role for this org

      // Verify organization exists
      const organization = await organizationsDb.getOrganization(id);
      if (!organization) {
        return reply.status(404).send({
          error: 'Organization not found',
        });
      }

      // Invite member
      const member = await organizationsDb.inviteMember(id, body.email, body.role);

      return reply.status(201).send({
        member,
        message: `Invitation sent to ${body.email}`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      throw error;
    }
  });

  /**
   * GET /api/orgs/:id/members
   * List organization members
   */
  fastify.get('/:id/members', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      // TODO: Check user has access to this org

      // Verify organization exists
      const organization = await organizationsDb.getOrganization(id);
      if (!organization) {
        return reply.status(404).send({
          error: 'Organization not found',
        });
      }

      const members = await organizationsDb.listMembers(id);

      return {
        members,
        count: members.length,
      };
    } catch (error) {
      throw error;
    }
  });

  /**
   * PATCH /api/orgs/:id/members/:email
   * Update member role
   */
  fastify.patch('/:id/members/:email', async (request, reply) => {
    try {
      const { id, email } = request.params as { id: string; email: string };
      const body = UpdateMemberRoleSchema.parse(request.body);

      // TODO: Check user has owner role for this org
      // Only owners can change roles

      const member = await organizationsDb.updateMemberRole(id, email, body.role);

      if (!member) {
        return reply.status(404).send({
          error: 'Member not found',
        });
      }

      return {
        member,
        message: 'Member role updated successfully',
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      throw error;
    }
  });

  /**
   * DELETE /api/orgs/:id/members/:email
   * Remove member from organization
   */
  fastify.delete('/:id/members/:email', async (request, reply) => {
    try {
      const { id, email } = request.params as { id: string; email: string };

      // TODO: Check user has admin/owner role for this org

      const removed = await organizationsDb.removeMember(id, email);

      if (!removed) {
        return reply.status(404).send({
          error: 'Member not found',
        });
      }

      return {
        message: 'Member removed successfully',
      };
    } catch (error) {
      throw error;
    }
  });

  /**
   * POST /api/orgs/:id/members/:email/accept
   * Accept organization invitation
   */
  fastify.post('/:id/members/:email/accept', async (request, reply) => {
    try {
      const { id, email } = request.params as { id: string; email: string };

      // TODO: Verify the requesting user matches the email

      const member = await organizationsDb.markMemberJoined(id, email);

      if (!member) {
        return reply.status(404).send({
          error: 'Invitation not found or already accepted',
        });
      }

      return {
        member,
        message: 'Invitation accepted successfully',
      };
    } catch (error) {
      throw error;
    }
  });
}
