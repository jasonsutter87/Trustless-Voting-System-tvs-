/**
 * Jurisdiction Management Routes
 * Hierarchical jurisdiction system: Federal > State > County > City
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { uuid } from '@tvs/core';

// In-memory store for MVP (replace with PostgreSQL)
const jurisdictions = new Map<string, Jurisdiction>();

export interface Jurisdiction {
  id: string;
  parentId: string | null;
  name: string;
  type: 'federal' | 'state' | 'county' | 'city' | 'district' | 'precinct';
  code: string;
  fullPath: string;
  level: number;
  publicKey?: string;
  threshold?: number;
  totalTrustees?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

const CreateJurisdictionSchema = z.object({
  parentId: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  type: z.enum(['federal', 'state', 'county', 'city', 'district', 'precinct']),
  code: z.string().min(1).regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric with dashes'),
  metadata: z.record(z.unknown()).optional(),
});

// Initialize with Federal jurisdiction
function initializeDefaultJurisdictions() {
  if (jurisdictions.size === 0) {
    // Federal
    const federal: Jurisdiction = {
      id: '00000000-0000-0000-0000-000000000001',
      parentId: null,
      name: 'United States',
      type: 'federal',
      code: 'US',
      fullPath: 'United States',
      level: 0,
      createdAt: new Date().toISOString(),
    };
    jurisdictions.set(federal.id, federal);
    jurisdictions.set(federal.code, federal); // Also index by code

    // Add California as example state
    const california: Jurisdiction = {
      id: uuid(),
      parentId: federal.id,
      name: 'California',
      type: 'state',
      code: 'US-CA',
      fullPath: 'United States > California',
      level: 1,
      createdAt: new Date().toISOString(),
    };
    jurisdictions.set(california.id, california);
    jurisdictions.set(california.code, california);

    // Add Placer County
    const placer: Jurisdiction = {
      id: uuid(),
      parentId: california.id,
      name: 'Placer County',
      type: 'county',
      code: 'US-CA-PLACER',
      fullPath: 'United States > California > Placer County',
      level: 2,
      createdAt: new Date().toISOString(),
    };
    jurisdictions.set(placer.id, placer);
    jurisdictions.set(placer.code, placer);
  }
}

// Get jurisdiction chain (from current up to federal)
function getJurisdictionChain(jurisdictionId: string): Jurisdiction[] {
  const chain: Jurisdiction[] = [];
  let current = jurisdictions.get(jurisdictionId);

  while (current) {
    chain.unshift(current); // Add to beginning (federal first)
    if (current.parentId) {
      current = jurisdictions.get(current.parentId);
    } else {
      break;
    }
  }

  return chain;
}

// Get children of a jurisdiction
function getChildren(parentId: string): Jurisdiction[] {
  const children: Jurisdiction[] = [];
  for (const j of jurisdictions.values()) {
    if (j.parentId === parentId && j.id !== j.code) { // Skip code-indexed duplicates
      children.push(j);
    }
  }
  return children.sort((a, b) => a.name.localeCompare(b.name));
}

export async function jurisdictionRoutes(fastify: FastifyInstance) {
  // Initialize default jurisdictions on startup
  initializeDefaultJurisdictions();

  // Create jurisdiction
  fastify.post('/', async (request, reply) => {
    const body = CreateJurisdictionSchema.parse(request.body);

    // Check if code already exists
    if (jurisdictions.has(body.code)) {
      return reply.status(409).send({ error: `Jurisdiction with code ${body.code} already exists` });
    }

    // Validate parent exists
    let parent: Jurisdiction | undefined;
    let level = 0;
    let fullPath = body.name;

    if (body.parentId) {
      parent = jurisdictions.get(body.parentId);
      if (!parent) {
        return reply.status(400).send({ error: 'Parent jurisdiction not found' });
      }
      level = parent.level + 1;
      fullPath = `${parent.fullPath} > ${body.name}`;
    }

    const jurisdiction: Jurisdiction = {
      id: uuid(),
      parentId: body.parentId || null,
      name: body.name,
      type: body.type,
      code: body.code,
      fullPath,
      level,
      metadata: body.metadata,
      createdAt: new Date().toISOString(),
    };

    jurisdictions.set(jurisdiction.id, jurisdiction);
    jurisdictions.set(jurisdiction.code, jurisdiction);

    return { jurisdiction };
  });

  // Get jurisdiction by ID or code
  fastify.get('/:idOrCode', async (request, reply) => {
    const { idOrCode } = request.params as { idOrCode: string };
    const jurisdiction = jurisdictions.get(idOrCode);

    if (!jurisdiction) {
      return reply.status(404).send({ error: 'Jurisdiction not found' });
    }

    return { jurisdiction };
  });

  // Get jurisdiction chain (ancestry from current to federal)
  fastify.get('/:idOrCode/chain', async (request, reply) => {
    const { idOrCode } = request.params as { idOrCode: string };
    const jurisdiction = jurisdictions.get(idOrCode);

    if (!jurisdiction) {
      return reply.status(404).send({ error: 'Jurisdiction not found' });
    }

    const chain = getJurisdictionChain(jurisdiction.id);

    return {
      jurisdiction,
      chain,
      chainCodes: chain.map(j => j.code),
    };
  });

  // Get children of a jurisdiction
  fastify.get('/:idOrCode/children', async (request, reply) => {
    const { idOrCode } = request.params as { idOrCode: string };
    const jurisdiction = jurisdictions.get(idOrCode);

    if (!jurisdiction) {
      return reply.status(404).send({ error: 'Jurisdiction not found' });
    }

    const children = getChildren(jurisdiction.id);

    return {
      parent: jurisdiction,
      children,
    };
  });

  // List all jurisdictions (with optional filters)
  fastify.get('/', async (request) => {
    const { type, level, parentId } = request.query as {
      type?: string;
      level?: string;
      parentId?: string;
    };

    let result = Array.from(jurisdictions.values())
      // Filter out code-indexed duplicates
      .filter(j => j.id !== j.code);

    if (type) {
      result = result.filter(j => j.type === type);
    }

    if (level !== undefined) {
      result = result.filter(j => j.level === parseInt(level, 10));
    }

    if (parentId) {
      result = result.filter(j => j.parentId === parentId);
    }

    return {
      jurisdictions: result.sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        return a.name.localeCompare(b.name);
      }),
    };
  });

  // List states (convenience endpoint)
  fastify.get('/states', async () => {
    const states = Array.from(jurisdictions.values())
      .filter(j => j.type === 'state')
      .sort((a, b) => a.name.localeCompare(b.name));

    return { states };
  });

  // Set threshold key configuration for jurisdiction
  fastify.patch('/:idOrCode/threshold', async (request, reply) => {
    const { idOrCode } = request.params as { idOrCode: string };
    const { threshold, totalTrustees, publicKey } = request.body as {
      threshold?: number;
      totalTrustees?: number;
      publicKey?: string;
    };

    const jurisdiction = jurisdictions.get(idOrCode);
    if (!jurisdiction) {
      return reply.status(404).send({ error: 'Jurisdiction not found' });
    }

    if (threshold !== undefined) jurisdiction.threshold = threshold;
    if (totalTrustees !== undefined) jurisdiction.totalTrustees = totalTrustees;
    if (publicKey !== undefined) jurisdiction.publicKey = publicKey;

    jurisdictions.set(jurisdiction.id, jurisdiction);
    jurisdictions.set(jurisdiction.code, jurisdiction);

    return { jurisdiction };
  });
}

// Export for use by other routes
export { jurisdictions, getJurisdictionChain, getChildren };
