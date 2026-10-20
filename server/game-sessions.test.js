import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import pg from 'pg';
import { createGameRouter, createGameStore, initGameSessions } from './game-sessions.js';

test('game HTTP endpoints deny full capacity, invalid tokens, cross-site requests and store failures', async t => {
  let full = false, expired = false, fail = false;
  const token = 'a'.repeat(64);
  const store = {
    acquire: async () => { if (fail) throw Error(); return full ? null : { token }; },
    heartbeat: async () => expired ? null : { expiresIn: 90 },
    release: async () => {},
  };
  const app = express(); app.use(express.json()); app.use('/sessions', createGameRouter(store));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path = '', body = {}, origin = base) => fetch(base + '/sessions' + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(body),
  });
  const granted = await post(); assert.equal(granted.status, 201);
  assert.equal(granted.headers.get('cache-control'), 'no-store');
  full = true; const busy = await post(); assert.equal(busy.status, 429); assert.equal(busy.headers.get('retry-after'), '20');
  assert.equal((await post('', {}, 'https://unrelated.example')).status, 403);
  assert.equal((await post('/heartbeat', { token: 'wrong' })).status, 400);
  assert.equal((await post('/heartbeat', { token })).status, 200);
  expired = true; assert.equal((await post('/heartbeat', { token })).status, 410);
  assert.equal((await post('/release', { token })).status, 204);
  fail = true; assert.equal((await post()).status, 503);
});

test('PostgreSQL enforces three slots under contention and preserves leases across store restarts', {
  skip: !process.env.GAME_TEST_DATABASE_URL,
}, async t => {
  // Point only at a disposable test DB: this test deliberately resets its slots.
  const pool = new pg.Pool({ connectionString: process.env.GAME_TEST_DATABASE_URL, max: 10 });
  t.after(() => pool.end());
  await initGameSessions(pool);
  await pool.query('UPDATE portfolio_game_slots SET token_hash = NULL, started_at = NULL, expires_at = NULL');
  const store = createGameStore(pool);
  const results = await Promise.all(Array.from({ length: 30 }, () => store.acquire()));
  const admitted = results.filter(Boolean);
  assert.equal(admitted.length, 3, 'Concurrent requests must never admit a fourth session');
  assert.equal(new Set(admitted.map(s => s.token)).size, 3);
  assert.equal(await createGameStore(pool).acquire(), null, 'New store instance must retain existing leases');
  await store.release('f'.repeat(64));
  assert.equal(await store.acquire(), null, 'Unrelated token must not free a slot');
  const raw = await pool.query('SELECT token_hash FROM portfolio_game_slots');
  assert.ok(raw.rows.every(row => !admitted.some(s => s.token === row.token_hash)), 'Only token digests stored');
  assert.ok((await store.heartbeat(admitted[0].token)).expiresIn > 80);
  await store.release(admitted[0].token);
  const replacement = await store.acquire(); assert.ok(replacement);
  assert.equal(await store.heartbeat(admitted[0].token), null, 'Released token cannot reclaim a new lease');
  assert.equal(await store.acquire(), null);
  await pool.query("UPDATE portfolio_game_slots SET expires_at = clock_timestamp() - INTERVAL '1 second'");
  assert.equal(await store.heartbeat(replacement.token), null, 'Expired leases cannot be renewed');
  const recovered = await store.acquire(); assert.ok(recovered, 'Disconnected slots are reclaimed');
  await pool.query("UPDATE portfolio_game_slots SET started_at = clock_timestamp() - INTERVAL '16 minutes' WHERE token_hash IS NOT NULL");
  assert.equal(await store.heartbeat(recovered.token), null, 'Maximum session duration enforced by server');
  await initGameSessions(pool);
  const count = await pool.query('SELECT COUNT(*)::int AS count FROM portfolio_game_slots');
  assert.equal(count.rows[0].count, 3, 'Initialization is idempotent with bounded storage');
});
