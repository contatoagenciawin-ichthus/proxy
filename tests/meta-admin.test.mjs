import test from 'node:test';
import assert from 'node:assert/strict';
import { getAdminConfig, isPlatformAdmin, requestHasAdminOrigin, adminCallbacks } from '../lib/meta-admin/policy.mjs';
import { listConnections, findConnection, inventorySummary } from '../lib/meta-admin/inventory.mjs';
const env = { PROXY_ADMIN_ENABLED: 'true', PROXY_ADMIN_ORIGIN: 'https://admin-preview.example.com',
  PROXY_ADMIN_AUTH_SECRET: 'test-only-auth-secret-at-least-32-characters',
  PROXY_ADMIN_GITHUB_ID: 'test-client', PROXY_ADMIN_GITHUB_SECRET: 'test-secret',
  PROXY_ADMIN_GITHUB_IDS: '123,456', NODE_ENV: 'production' };
test('admin fails closed without enablement, credentials, origin or explicit identities', () => {
  for (const key of Object.keys(env).filter(k => k !== 'NODE_ENV')) {
    assert.equal(getAdminConfig({ ...env, [key]: '' }), null, key);
  }
  for (const origin of ['http://example.com', 'https://user:password@example.com', 'https://example.com/path', 'https://example.com/?key=x']) {
    assert.equal(getAdminConfig({ ...env, PROXY_ADMIN_ORIGIN: origin }), null);
  }
  assert.equal(getAdminConfig({ ...env, PROXY_ADMIN_GITHUB_IDS: '123,admin' }), null);
  assert.equal(getAdminConfig({ ...env, PROXY_ADMIN_ORIGIN: 'http://localhost:3000' }), null);
  assert.ok(getAdminConfig({ ...env, NODE_ENV: 'development', PROXY_ADMIN_ORIGIN: 'http://localhost:3000' }));
});
test('OAuth identity is explicit; CRM roles, matching email and foreign providers do not grant access', () => {
  const callbacks = adminCallbacks(() => getAdminConfig(env));
  assert.equal(callbacks.signIn({ account: { provider: 'github', providerAccountId: '123' } }), true);
  assert.equal(callbacks.signIn({ account: { provider: 'google', providerAccountId: '123' } }), false);
  assert.equal(callbacks.signIn({ account: { provider: 'github', providerAccountId: '999' }, user: { role: 'admin', email: 'admin@proxy.example' } }), false);
  assert.equal(callbacks.signIn({ account: null }), false);
  assert.equal(isPlatformAdmin(123, getAdminConfig(env)), false);
});
test('session updates cannot escalate identity; revocation takes effect on existing sessions', () => {
  let config = getAdminConfig(env);
  const callbacks = adminCallbacks(() => config);
  const token = callbacks.jwt({ token: {}, account: { provider: 'github', providerAccountId: '123', access_token: 'never-retain' } });
  assert.deepEqual(token, { proxyAdminId: '123', sub: '123' });
  assert.equal(JSON.stringify(token).includes('never-retain'), false);
  assert.equal(callbacks.jwt({ token: { proxyAdminId: '999' }, trigger: 'update', session: { proxyAdminId: '123', role: 'admin' } }), null);
  assert.deepEqual(callbacks.session({ session: { expires: 'later', user: { email: 'private', role: 'admin' } }, token }), { expires: 'later', user: { id: '123' } });
  config = { ...config, ids: ['456'] };
  assert.equal(callbacks.jwt({ token }), null);
  assert.equal(callbacks.session({ session: { expires: 'later' }, token }).user, undefined);
});
test('auth requests reject unapproved hosts and cross-origin requests', () => {
  const config = getAdminConfig(env);
  assert.equal(requestHasAdminOrigin(new Request('https://admin-preview.example.com/api/meta/admin/auth/session'), config), true);
  assert.equal(requestHasAdminOrigin(new Request('https://evil.example.com/api/meta/admin/auth/session'), config), false);
  assert.equal(requestHasAdminOrigin(new Request('https://admin-preview.example.com/api/meta/admin/auth/session', { headers: { origin: 'https://evil.example.com' } }), config), false);
});
test('inventory distinguishes reported production from live health and preserves source dates', () => {
  const records = listConnections();
  assert.equal(records.length, 3);
  assert.deepEqual(inventorySummary(), { registered: 3, productionReported: 2, pending: 1, verifiedLive: 0 });
  for (const record of records) {
    assert.equal(record.webhook, 'Não verificado');
    assert.equal(record.credential, 'Não verificada');
    assert.ok(record.evidence.every(e => e.date && e.kind && e.text));
    assert.equal(Object.hasOwn(record, 'accessToken'), false);
  }
  records[0].name = 'mutated';
  assert.equal(findConnection('eduardo-brasil').name, 'Eduardo Brasil');
  assert.equal(findConnection('unknown'), null);
  assert.equal(findConnection('la-climatizacao').wabaId, null);
});
