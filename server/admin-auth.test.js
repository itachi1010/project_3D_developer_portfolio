import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { createAdminAuth } from './admin-auth.js';

const password = 'test-password-at-least-twenty-characters';
const basic = (value) => `Basic ${Buffer.from(value).toString('base64')}`;

test('admin access fails closed, checks credentials, and throttles failures', async (t) => {
  let time = 1000;
  const app = express();
  const auth = createAdminAuth({ username: 'admin', password, now: () => time });
  app.get('/configured', auth, (_req, res) => res.json({ ok: true }));
  app.get('/disabled', createAdminAuth({ username: '', password: '' }), (_req, res) => res.end());
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (path, authorization) => fetch(base + path, {
    headers: authorization ? { authorization } : {},
  });
  assert.equal((await request('/disabled')).status, 503);
  assert.equal((await request('/configured')).status, 401);
  assert.equal((await request('/configured', basic('wrong:' + password))).status, 401);
  assert.equal((await request('/configured', basic('admin:wrong'))).status, 401);
  const good = await request('/configured', basic('admin:' + password));
  assert.equal(good.status, 200);
  assert.equal(good.headers.get('cache-control'), 'no-store');
  for (let i = 0; i < 10; i++) assert.equal((await request('/configured')).status, 401);
  assert.equal((await request('/configured', basic('admin:' + password))).status, 429);
  time += 60_001;
  assert.equal((await request('/configured', basic('admin:' + password))).status, 200);
});
