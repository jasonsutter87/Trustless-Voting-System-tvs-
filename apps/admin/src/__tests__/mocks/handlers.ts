import { http, HttpResponse } from 'msw';

const API_BASE = process.env.TVS_API_URL || 'http://localhost:3000';

// Mock data stores
let elections: Record<string, unknown> = {};
let questions: Record<string, unknown[]> = {};
let trustees: Record<string, unknown[]> = {};

export const resetMockData = () => {
  elections = {};
  questions = {};
  trustees = {};
};

export const handlers = [
  // Elections endpoints
  http.post(`${API_BASE}/api/elections`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const id = `election-${Date.now()}`;
    const election = {
      id,
      ...body,
      status: 'setup',
      createdAt: new Date().toISOString(),
    };
    elections[id] = election;
    return HttpResponse.json({ election });
  }),

  http.get(`${API_BASE}/api/elections`, () => {
    return HttpResponse.json({ elections: Object.values(elections) });
  }),

  http.get(`${API_BASE}/api/elections/:id`, ({ params }) => {
    const election = elections[params.id as string];
    if (!election) {
      return HttpResponse.json({ error: 'Election not found' }, { status: 404 });
    }
    return HttpResponse.json({ election });
  }),

  http.patch(`${API_BASE}/api/elections/:id/status`, async ({ params, request }) => {
    const election = elections[params.id as string] as Record<string, unknown> | undefined;
    if (!election) {
      return HttpResponse.json({ error: 'Election not found' }, { status: 404 });
    }
    const body = await request.json() as { status: string };
    election.status = body.status;
    return HttpResponse.json({ election });
  }),

  // Ballot endpoints
  http.post(`${API_BASE}/api/elections/:electionId/questions`, async ({ params, request }) => {
    const electionId = params.electionId as string;
    const body = await request.json() as Record<string, unknown>;
    const id = `question-${Date.now()}`;
    const question = { id, ...body };

    if (!questions[electionId]) {
      questions[electionId] = [];
    }
    questions[electionId].push(question);
    return HttpResponse.json({ question });
  }),

  http.get(`${API_BASE}/api/elections/:electionId/questions`, ({ params }) => {
    const electionId = params.electionId as string;
    return HttpResponse.json({ questions: questions[electionId] || [] });
  }),

  http.patch(`${API_BASE}/api/elections/:electionId/questions/:questionId`, async ({ params, request }) => {
    const electionId = params.electionId as string;
    const questionId = params.questionId as string;
    const body = await request.json() as Record<string, unknown>;

    const electionQuestions = questions[electionId] || [];
    const index = electionQuestions.findIndex((q: unknown) => (q as { id: string }).id === questionId);

    if (index === -1) {
      return HttpResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    electionQuestions[index] = { ...electionQuestions[index] as Record<string, unknown>, ...body };
    return HttpResponse.json({ question: electionQuestions[index] });
  }),

  http.delete(`${API_BASE}/api/elections/:electionId/questions/:questionId`, ({ params }) => {
    const electionId = params.electionId as string;
    const questionId = params.questionId as string;

    if (questions[electionId]) {
      questions[electionId] = questions[electionId].filter((q: unknown) => (q as { id: string }).id !== questionId);
    }
    return HttpResponse.json({ success: true });
  }),

  // Trustees endpoints
  http.post(`${API_BASE}/api/elections/:electionId/trustees`, async ({ params, request }) => {
    const electionId = params.electionId as string;
    const body = await request.json() as Record<string, unknown>;
    const id = `trustee-${Date.now()}`;
    const trustee = { id, ...body, status: 'pending' };

    if (!trustees[electionId]) {
      trustees[electionId] = [];
    }
    trustees[electionId].push(trustee);
    return HttpResponse.json({ trustee });
  }),

  http.get(`${API_BASE}/api/elections/:electionId/trustees`, ({ params }) => {
    const electionId = params.electionId as string;
    return HttpResponse.json({ trustees: trustees[electionId] || [] });
  }),

  http.get(`${API_BASE}/api/elections/:electionId/ceremony/status`, ({ params }) => {
    const electionId = params.electionId as string;
    const electionTrustees = trustees[electionId] || [];
    return HttpResponse.json({
      status: {
        phase: electionTrustees.length > 0 ? 'REGISTRATION' : 'CREATED',
        registeredCount: electionTrustees.filter((t: unknown) => (t as { status: string }).status === 'registered').length,
        requiredCount: 5,
        committedCount: electionTrustees.filter((t: unknown) => (t as { status: string }).status === 'committed').length,
      },
    });
  }),

  // VeilForms status
  http.get(`${API_BASE}/api/veilforms/status`, () => {
    return HttpResponse.json({
      status: {
        connected: true,
        publicKey: 'mock-public-key-12345',
      },
    });
  }),
];

// Error handlers for testing error scenarios
export const errorHandlers = {
  serverError: http.get(`${API_BASE}/api/elections/:id`, () => {
    return HttpResponse.json({ error: 'Internal server error' }, { status: 500 });
  }),
  networkError: http.get(`${API_BASE}/api/elections/:id`, () => {
    return HttpResponse.error();
  }),
  unauthorized: http.get(`${API_BASE}/api/elections/:id`, () => {
    return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }),
  forbidden: http.get(`${API_BASE}/api/elections/:id`, () => {
    return HttpResponse.json({ error: 'Forbidden' }, { status: 403 });
  }),
  validationError: http.post(`${API_BASE}/api/elections`, () => {
    return HttpResponse.json(
      { error: 'Validation failed', details: { name: 'Name is required' } },
      { status: 400 }
    );
  }),
};
