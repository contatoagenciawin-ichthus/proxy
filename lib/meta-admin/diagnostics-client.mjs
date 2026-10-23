import { signedHeaders, validBinding, parseSnapshot, PATH } from './diagnostics-protocol.mjs';
const products = {
  'la-climatizacao': { prefix: 'LA', origin: 'https://app.laclimatizacao.com.br' },
  'eduardo-brasil': { prefix: 'EDUARDO', origin: 'https://eduardobrasil.fonsecabrasilserrao.com', wabaId: '269938242876600', phoneNumberId: '280401731826708' },
};
export function diagnosticConfig(client, env = process.env) {
  const product = products[client];
  if (!product) return { state: 'unsupported' };
  const prefix = 'PROXY_DIAGNOSTICS_' + product.prefix + '_';
  if (env.VERCEL_ENV !== 'production' || env.PROXY_DIAGNOSTICS_COLLECTION_ENABLED !== 'true' || env[prefix + 'ENABLED'] !== 'true') return { state: 'disabled' };
  const binding = { client, connectionId: env[prefix + 'CONNECTION_ID'], organizationId: client === 'la-climatizacao' ? env[prefix + 'ORGANIZATION_ID'] : null,
    wabaId: env[prefix + 'WABA_ID'], phoneNumberId: env[prefix + 'PHONE_NUMBER_ID'] };
  const secret = env[prefix + 'SECRET'] || '';
  if (!validBinding(binding) || secret.length < 32 || secret.length > 256 || (product.wabaId && (product.wabaId !== binding.wabaId || product.phoneNumberId !== binding.phoneNumberId))) return { state: 'unconfigured' };
  return { state: 'configured', binding, secret, url: product.origin + PATH };
}
async function boundedJson(response) {
  if (!response.body || !response.headers.get('content-type')?.includes('application/json')) throw new Error('Invalid response');
  const reader = response.body.getReader();
  const chunks = []; let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      length += value.byteLength; if (length > 8192) throw new Error('Response too large');
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } finally { await reader.cancel().catch(() => {}); }
}
export async function readProductDiagnostic(client, env = process.env, fetcher = fetch, now = Date.now()) {
  const config = diagnosticConfig(client, env);
  if (config.state !== 'configured') return { state: config.state, snapshot: null };
  try {
    const response = await fetcher(config.url, { method: 'GET', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(6000),
      headers: { accept: 'application/json', ...signedHeaders(config.binding, config.secret, now) } });
    if (!response.ok) return { state: response.status === 401 ? 'denied' : 'unavailable', snapshot: null };
    const snapshot = parseSnapshot(await boundedJson(response), config.binding, now);
    return { state: snapshot ? 'available' : 'invalid', snapshot };
  } catch { return { state: 'unavailable', snapshot: null }; }
}
