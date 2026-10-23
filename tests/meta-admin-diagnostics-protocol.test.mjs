import assert from 'node:assert/strict';
import test from 'node:test';
import { productConfig, signedHeaders, authorizedRequest, handleDiagnosticRequest, makeSnapshot, parseSnapshot, PATH } from '../lib/meta-admin/diagnostics-protocol.mjs';
const now = Date.now();
const binding = { client: 'la-climatizacao', organizationId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', connectionId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', wabaId:'1234567890', phoneNumberId:'1234567891' };
const secret = 'SYNTHETIC_DIAGNOSTICS_KEY_ONLY_FOR_TESTS_123';
const env = { VERCEL_ENV:'production', PROXY_DIAGNOSTICS_ENABLED:'true', PROXY_DIAGNOSTICS_SECRET:secret, PROXY_DIAGNOSTICS_ORGANIZATION_ID:binding.organizationId, PROXY_DIAGNOSTICS_CONNECTION_ID:binding.connectionId, PROXY_DIAGNOSTICS_WABA_ID:binding.wabaId, PROXY_DIAGNOSTICS_PHONE_NUMBER_ID:binding.phoneNumberId };
const config = productConfig(binding.client,env);
const request = (headers = signedHeaders(binding, secret, now), path = PATH, method='GET') => new Request('https://product.example'+path, {headers,method});
const fixture = () => makeSnapshot(binding, { credential: {state:'recorded',expiresAt:null}, webhook: {lastReceivedAt:new Date(now-1000).toISOString(), lastProcessedAt:null, failures24h:0, failuresCapped:false, coverage:'connection-events'} }, now);
test('production-only feature gate, explicit binding and dedicated secret',()=>{
  assert.ok(config);for(const patch of [{VERCEL_ENV:'preview'},{VERCEL_ENV:'development'},{PROXY_DIAGNOSTICS_ENABLED:'false'},{PROXY_DIAGNOSTICS_SECRET:''},{PROXY_DIAGNOSTICS_ORGANIZATION_ID:''},{PROXY_DIAGNOSTICS_CONNECTION_ID:'not-uuid'},{PROXY_DIAGNOSTICS_WABA_ID:'1&evil'},{PROXY_DIAGNOSTICS_PHONE_NUMBER_ID:''}])assert.equal(productConfig(binding.client,{...env,...patch}),null);
});
test('HMAC binds method, route, organization, connection, WABA and number',()=>{
  assert.ok(authorizedRequest(request(),config,now));
  for(const key of ['organizationId','connectionId','wabaId','phoneNumberId'])assert.equal(authorizedRequest(request(),{...config,binding:{...binding,[key]:'other'}},now),false);
  assert.equal(authorizedRequest(request(undefined,PATH,'POST'),config,now),false);
  for(const path of [PATH+'?client=other',PATH+'/elsewhere'])assert.equal(authorizedRequest(request(undefined,path),config,now),false);
  for(const headers of [{}, {...signedHeaders(binding,secret,now),origin:'https://example.com'}, {...signedHeaders(binding,secret,now),cookie:'session=crm'}, signedHeaders(binding,'WRONG_KEY',now),signedHeaders(binding,secret,now-61000),signedHeaders(binding,secret,now+61000), {...signedHeaders(binding,secret,now),'x-proxy-diagnostics-signature':'abc'}])assert.equal(authorizedRequest(request(headers),config,now),false);
});
test('unauthorized/disabled requests never collect; sanitized failures and no-store',async()=>{
  let calls=0;const collect=async()=>{calls++;return fixture();};
  assert.equal((await handleDiagnosticRequest(request(),null,collect)).status,404);
  assert.equal((await handleDiagnosticRequest(request({}),config,collect)).status,401);assert.equal(calls,0);
  const ok=await handleDiagnosticRequest(request(),config,collect);assert.equal(ok.status,200);assert.match(ok.headers.get('cache-control'),/no-store/);assert.deepEqual(await ok.json(),fixture());
  const fail=await handleDiagnosticRequest(request(),config,async()=>{throw new Error('SECRET_DATABASE_DETAILS');});assert.equal(fail.status,503);assert.ok(!(await fail.text()).includes('SECRET_DATABASE_DETAILS'));
});
test('strict projection rejects secrets, identity mismatch, stale or misleading data',()=>{
  assert.ok(parseSnapshot(fixture(),binding,now));
  for(const change of [s=>s.accessToken='SECRET',s=>s.connection.wabaId='999999',s=>s.connection.phoneNumberId='999999',s=>s.connection.organizationId='other',s=>s.meta.checked=true,s=>s.coexistence='confirmed',s=>s.webhook.message='private',s=>s.credential.token='SECRET',s=>s.observedAt=new Date(now-300001).toISOString(),s=>s.webhook.failures24h=-1,s=>s.webhook.lastReceivedAt=new Date(now+120000).toISOString()]){const s=fixture();change(s);assert.equal(parseSnapshot(s,binding,now),null);}
  const future=fixture();future.credential.expiresAt=new Date(now+86400000).toISOString();assert.ok(parseSnapshot(future,binding,now));
});
