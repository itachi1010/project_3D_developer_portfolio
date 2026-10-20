// Local integration test: reads ignored credentials without printing them.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const arg = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const base = arg('--base', 'http://127.0.0.1:8098');
const url = new URL(base);
assert.ok(['localhost', '127.0.0.1'].includes(url.hostname), 'Tests are local-only.');
const values = Object.fromEntries(readFileSync(resolve(root, '.env.production.local'), 'utf8')
  .split(/\r?\n/).filter((line) => /^[A-Z_]+=/.test(line))
  .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]));
const authorization = `Basic ${Buffer.from(`${values.ADMIN_USERNAME}:${values.ADMIN_PASSWORD}`).toString('base64')}`;
async function request(path, method = 'GET', data, authenticated = false) {
  return fetch(base + path, {
    method, headers: {
      ...(data ? { 'Content-Type': 'application/json' } : {}),
      ...(authenticated ? { Authorization: authorization } : {}),
    },
    ...(data ? { body: JSON.stringify(data) } : {}), signal: AbortSignal.timeout(15000),
  });
}
function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, { cwd: root, encoding: 'utf8', timeout: 180000 });
  assert.equal(result.status, 0, `${command} failed: ${result.error?.message || result.stderr || ''}`);
}
let id;
try {
  assert.equal((await request('/')).status, 200);
  assert.equal((await request('/healthz')).status, 200);
  assert.equal((await request('/api/health')).status, 200);
  assert.equal((await request('/api/ready')).status, 200);
  assert.equal((await request('/api/admin/session')).status, 401);
  assert.equal((await request('/api/admin/session', 'GET', null, true)).status, 200);
  const job = { title: 'Deployment smoke test', company_name: 'Local validation only', date: 'Test', points: ['temporary record'] };
  for (const method of ['POST', 'PUT', 'DELETE']) {
    assert.equal((await request('/api/jobs' + (method === 'POST' ? '' : '/999999'), method, job)).status, 401);
  }
  let response = await request('/api/jobs', 'POST', job, true);
  assert.equal(response.status, 201);
  id = (await response.json()).job.id;
  response = await request(`/api/jobs/${id}`, 'PUT', { ...job, title: 'Persistence smoke test' }, true);
  assert.equal(response.status, 200);
  if (args.includes('--restart-database')) {
    if (args.includes('--kubernetes')) {
      assert.equal(url.port, '8099');
      const kubectl = arg('--kubectl');
      assert.ok(kubectl, '--kubectl is required');
      run(kubectl, ['--kubeconfig', resolve(root, '.local-deploy/kubeconfig.yaml'), '--context', 'k3d-portfolio-local', '-n', 'demos', 'delete', 'pod', 'portfolio-db-0', '--wait=true']);
    } else {
      assert.equal(url.port, values.PORTFOLIO_PORT || '8098');
      const compose = ['compose', '--env-file', '.env.production.local', '-f', 'compose.production.yaml'];
      run('docker', [...compose, 'stop', 'portfolio-db']);
      assert.equal((await request('/api/ready')).status, 503, 'Readiness must fail while DB is down.');
      assert.equal((await request('/api/health')).status, 200, 'Liveness must stay up while DB is down.');
      run('docker', [...compose, 'start', 'portfolio-db']);
    }
    let ready = false;
    for (let i = 0; i < 90; i++) {
      try { ready = (await request('/api/ready')).status === 200; } catch { /* wait for recovery */ }
      if (ready) break;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    assert.ok(ready, 'API did not recover after database restart.');
  }
  response = await request('/api/jobs');
  assert.equal(response.status, 200);
  const saved = (await response.json()).jobs.find((job) => job.id === id);
  assert.equal(saved?.title, 'Persistence smoke test');
  assert.deepEqual(saved.points, ['temporary record']);
  console.log('PASS: static frontend, probes, public reads, authenticated writes, rejected anonymous writes' + (args.includes('--restart-database') ? ', database persistence and recovery.' : '.'));
} finally {
  if (id) {
    const removed = await request(`/api/jobs/${id}`, 'DELETE', null, true);
    assert.equal(removed.status, 200, 'Could not remove temporary test job.');
  }
}
