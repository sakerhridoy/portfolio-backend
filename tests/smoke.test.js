import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

test('GET /api/health returns ok', async () => {
  const res = await request(app).get('/api/health');

  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { success: true, data: { status: 'ok' } });
});

test('unknown route returns 404 with clean error shape', async () => {
  const res = await request(app).get('/api/does-not-exist');

  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
  assert.equal(typeof res.body.message, 'string');
});

test('POST /api/auth/login validates input before touching the DB', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'not-an-email', password: '123' });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.equal(typeof res.body.message, 'string');
});

test('GET /api/auth/me without a token returns 401', async () => {
  const res = await request(app).get('/api/auth/me');

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test('POST /api/auth/register without a token returns 401', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test', email: 'test@example.com', password: 'secret123' });

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test('POST /api/leads validates input before touching the DB', async () => {
  const res = await request(app)
    .post('/api/leads')
    .send({ name: 'Test', email: 'not-an-email' });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.equal(typeof res.body.message, 'string');
});

// Phase 2 content collections -------------------------------------------------

const contentCollections = [
  { path: '/api/plans', body: { title: 'Basic', price: '$50' } },
  { path: '/api/testimonials', body: { name: 'Jane', review: 'Great work' } },
  { path: '/api/faqs', body: { question: 'Do you freelance?', answer: 'Yes' } },
  { path: '/api/blog', body: { title: 'Hello', content: 'World' } },
  { path: '/api/experience', body: { title: 'Frontend Developer' } },
  { path: '/api/achievements', body: { title: 'Best Marshal' } },
  { path: '/api/timeline', body: { year: '2025', title: 'Advanced Development' } },
];

for (const { path, body } of contentCollections) {
  test(`POST ${path} without a token returns 401`, async () => {
    const res = await request(app).post(path).send(body);

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(typeof res.body.message, 'string');
  });

  test(`GET ${path}?status=all without an admin token returns 403`, async () => {
    const res = await request(app).get(`${path}?status=all`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });
}

test('PUT /api/resume without a token returns 401', async () => {
  const res = await request(app).put('/api/resume').send({ intro: 'hi' });

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test('PUT /api/settings without a token returns 401', async () => {
  const res = await request(app).put('/api/settings').send({ heroTitle: 'Hi' });

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test('POST /api/uploads without a token returns 401', async () => {
  const res = await request(app).post('/api/uploads');

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

// User management ------------------------------------------------------------

test('GET /api/auth/users without a token returns 401', async () => {
  const res = await request(app).get('/api/auth/users');

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test('PATCH /api/auth/users/:id without a token returns 401', async () => {
  const res = await request(app)
    .patch('/api/auth/users/64b7f1c2a1b2c3d4e5f60718')
    .send({ role: 'editor' });

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test('DELETE /api/auth/users/:id without a token returns 401', async () => {
  const res = await request(app).delete('/api/auth/users/64b7f1c2a1b2c3d4e5f60718');

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});
