import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
export const PATH = '/api/proxy/diagnostics';
export const CLIENTS = ['la-climatizacao', 'eduardo-brasil'];
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const numeric = /^[1-9][0-9]{4,24}$/;
export function validBinding(b) {
  return !!b && CLIENTS.includes(b.client) && uuid.test(b.connectionId || '') && numeric.test(b.wabaId || '') && numeric.test(b.phoneNumberId || '') &&
    (b.client === 'la-climatizacao' ? uuid.test(b.organizationId || '') : b.organizationId === null);
}
export function productConfig(client, env = process.env) {
  const b = { client, connectionId: env.PROXY_DIAGNOSTICS_CONNECTION_ID, organizationId: client === 'la-climatizacao' ? env.PROXY_DIAGNOSTICS_ORGANIZATION_ID : null,
    wabaId: env.PROXY_DIAGNOSTICS_WABA_ID, phoneNumberId: env.PROXY_DIAGNOSTICS_PHONE_NUMBER_ID };
  const secret = env.PROXY_DIAGNOSTICS_SECRET || '';
  if (env.VERCEL_ENV !== 'production' || env.PROXY_DIAGNOSTICS_ENABLED !== 'true' || !validBinding(b) || secret.length < 32 || secret.length > 256) return null;
  return { binding: b, secret };
}
function canonical(binding, timestamp, nonce) {
  return ['proxy-diagnostics-v1', 'GET', PATH, binding.client, binding.organizationId || '-', binding.connectionId, binding.wabaId, binding.phoneNumberId, timestamp, nonce].join('\n');
}
export function signedHeaders(binding, secret, now = Date.now(), nonce = randomUUID()) {
  const timestamp = String(Math.floor(now / 1000));
  return { 'x-proxy-diagnostics-time': timestamp, 'x-proxy-diagnostics-nonce': nonce,
    'x-proxy-diagnostics-signature': createHmac('sha256', secret).update(canonical(binding, timestamp, nonce)).digest('hex') };
}
export function authorizedRequest(request, config, now = Date.now()) {
  if (!config || request.method !== 'GET') return false;
  const url = new URL(request.url);
  if (url.pathname !== PATH || url.search || request.headers.has('origin') || request.headers.has('cookie')) return false;
  const time = request.headers.get('x-proxy-diagnostics-time') || '';
  const nonce = request.headers.get('x-proxy-diagnostics-nonce') || '';
  const signature = request.headers.get('x-proxy-diagnostics-signature') || '';
  if (!/^[0-9]{10}$/.test(time) || !uuid.test(nonce) || !/^[a-f0-9]{64}$/.test(signature) || Math.abs(now / 1000 - Number(time)) > 60) return false;
  const expected = createHmac('sha256', config.secret).update(canonical(config.binding, time, nonce)).digest();
  return timingSafeEqual(Buffer.from(signature, 'hex'), expected);
}
export const RESPONSE_HEADERS = { 'cache-control': 'private, no-store, max-age=0', 'x-content-type-options': 'nosniff', 'x-robots-tag': 'noindex, nofollow', 'referrer-policy': 'no-referrer' };
export function iso(value) { return typeof value === 'string' && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null; }
export function makeSnapshot(binding, data, now = Date.now()) {
  return { version: 1, client: binding.client, connection: { organizationId: binding.organizationId, connectionId: binding.connectionId, wabaId: binding.wabaId, phoneNumberId: binding.phoneNumberId },
    observedAt: new Date(now).toISOString(), source: 'product-database', credential: data.credential,
    webhook: data.webhook, meta: { checked: false }, coexistence: 'undetermined' };
}
// Strict contract: reject new/unknown fields rather than forwarding raw product data.
export function parseSnapshot(raw, binding, now = Date.now()) {
  const keys = (o, names) => o && typeof o === 'object' && !Array.isArray(o) && Object.keys(o).sort().join(',') === names.split(',').sort().join(',');
  const date = v => v === null || (typeof v === 'string' && iso(v) === v && Date.parse(v) <= now + 60000);
  if (!validBinding(binding) || !keys(raw, 'version,client,connection,observedAt,source,credential,webhook,meta,coexistence') || raw.version !== 1 || raw.client !== binding.client || raw.source !== 'product-database' || raw.coexistence !== 'undetermined') return null;
  if (!keys(raw.connection, 'organizationId,connectionId,wabaId,phoneNumberId') || Object.keys(raw.connection).some(k => raw.connection[k] !== binding[k])) return null;
  if (!date(raw.observedAt) || raw.observedAt === null || now - Date.parse(raw.observedAt) > 300000) return null;
  if (!keys(raw.meta, 'checked') || raw.meta.checked !== false) return null;
  const c = raw.credential, w = raw.webhook;
  if (!keys(c, 'state,expiresAt') || !['missing','recorded','expired','invalid_scope'].includes(c.state) || !(c.expiresAt === null || (typeof c.expiresAt === 'string' && iso(c.expiresAt) === c.expiresAt))) return null;
  if (!keys(w, 'lastReceivedAt,lastProcessedAt,failures24h,failuresCapped,coverage') || !date(w.lastReceivedAt) || !date(w.lastProcessedAt) || !Number.isInteger(w.failures24h) || w.failures24h < 0 || w.failures24h > 100 || typeof w.failuresCapped !== 'boolean' || w.failuresCapped !== (w.failures24h === 100) || w.coverage !== (binding.client === 'la-climatizacao' ? 'connection-events' : 'first-entry-metadata')) return null;
  return structuredClone(raw);
}
export async function handleDiagnosticRequest(request, config, collect) {
  if (!config) return Response.json({ error: 'not_available' }, { status: 404, headers: RESPONSE_HEADERS });
  if (!authorizedRequest(request, config)) return Response.json({ error: 'unauthorized' }, { status: 401, headers: RESPONSE_HEADERS });
  try {
    const result = await collect(config.binding);
    const safe = parseSnapshot(result, config.binding);
    if (!safe) throw new Error('Invalid diagnostic contract');
    return Response.json(safe, { headers: RESPONSE_HEADERS });
  } catch {
    return Response.json({ error: 'diagnostic_unavailable' }, { status: 503, headers: RESPONSE_HEADERS });
  }
}
