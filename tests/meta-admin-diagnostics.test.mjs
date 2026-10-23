import assert from 'node:assert/strict';
import test from 'node:test';
import { readProductDiagnostic, diagnosticConfig } from '../lib/meta-admin/diagnostics-client.mjs';
import { handleDiagnosticRequest, makeSnapshot } from '../lib/meta-admin/diagnostics-protocol.mjs';
const now=Date.now();
const env={VERCEL_ENV:'production',PROXY_DIAGNOSTICS_COLLECTION_ENABLED:'true',PROXY_DIAGNOSTICS_LA_ENABLED:'true',PROXY_DIAGNOSTICS_LA_SECRET:'SYNTHETIC_DIAGNOSTICS_KEY_ONLY_FOR_TESTS_123',PROXY_DIAGNOSTICS_LA_ORGANIZATION_ID:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',PROXY_DIAGNOSTICS_LA_CONNECTION_ID:'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',PROXY_DIAGNOSTICS_LA_WABA_ID:'12345678',PROXY_DIAGNOSTICS_LA_PHONE_NUMBER_ID:'87654321'};
const config=diagnosticConfig('la-climatizacao',env);
const fixture=()=>makeSnapshot(config.binding,{credential:{state:'recorded',expiresAt:null},webhook:{lastReceivedAt:null,lastProcessedAt:null,failures24h:0,failuresCapped:false,coverage:'connection-events'}},now);
test('collector remains off in preview even with all switches and credentials present',async()=>{
 let calls=0;const fetcher=async()=>{calls++;throw new Error('must not fetch');};
 for(const patch of [{VERCEL_ENV:'preview'},{VERCEL_ENV:'development'},{PROXY_DIAGNOSTICS_COLLECTION_ENABLED:'false'},{PROXY_DIAGNOSTICS_LA_ENABLED:'false'}])assert.equal((await readProductDiagnostic('la-climatizacao',{...env,...patch},fetcher,now)).state,'disabled');
 assert.equal((await readProductDiagnostic('ichthus',env,fetcher,now)).state,'unsupported');
 assert.equal((await readProductDiagnostic('la-climatizacao',{...env,PROXY_DIAGNOSTICS_LA_SECRET:''},fetcher,now)).state,'unconfigured');assert.equal(calls,0);
});
test('server-to-server path verifies HMAC and complete identity; no cookies or redirects',async()=>{
 const result=await readProductDiagnostic('la-climatizacao',env,async(url,options)=>{
  assert.equal(url,'https://app.laclimatizacao.com.br/api/proxy/diagnostics');assert.equal(options.method,'GET');assert.equal(options.redirect,'error');assert.equal(options.cache,'no-store');assert.ok(options.signal);assert.equal(options.headers.cookie,undefined);
  return handleDiagnosticRequest(new Request(url,options),config,async()=>fixture());
 },now);
 assert.equal(result.state,'available');assert.deepEqual(result.snapshot,fixture());assert.equal(result.snapshot.meta.checked,false);
});
test('untrusted, oversized, stale, cross-tenant and malformed responses never render as health',async()=>{
 for(const transform of [s=>({...s,token:'SECRET'}),s=>({...s,observedAt:new Date(now-300001).toISOString()}),s=>({...s,connection:{...s.connection,organizationId:'other'}}),s=>({...s,meta:{checked:true}})]){
  const r=await readProductDiagnostic('la-climatizacao',env,async()=>Response.json(transform(fixture())),now);assert.equal(r.state,'invalid');assert.equal(r.snapshot,null);
 }
 for(const response of [new Response('SECRET'.repeat(2000),{headers:{'content-type':'application/json'}}),new Response('bad json',{headers:{'content-type':'application/json'}}),new Response('html')]){
  const r=await readProductDiagnostic('la-climatizacao',env,async()=>response,now);assert.equal(r.state,'unavailable');assert.equal(r.snapshot,null);
 }
 for(const [code,state] of [[401,'denied'],[404,'unavailable'],[503,'unavailable']])assert.equal((await readProductDiagnostic('la-climatizacao',env,async()=>new Response('PRIVATE_ERROR',{status:code}),now)).state,state);
 assert.equal((await readProductDiagnostic('la-climatizacao',env,async()=>{throw new Error('timeout');},now)).state,'unavailable');
});
test('Eduardo cannot be rebound to an unrelated inventory asset',()=>{
 const e={...env,PROXY_DIAGNOSTICS_EDUARDO_ENABLED:'true',PROXY_DIAGNOSTICS_EDUARDO_SECRET:env.PROXY_DIAGNOSTICS_LA_SECRET,PROXY_DIAGNOSTICS_EDUARDO_CONNECTION_ID:env.PROXY_DIAGNOSTICS_LA_CONNECTION_ID,PROXY_DIAGNOSTICS_EDUARDO_WABA_ID:'269938242876600',PROXY_DIAGNOSTICS_EDUARDO_PHONE_NUMBER_ID:'280401731826708'};
 assert.equal(diagnosticConfig('eduardo-brasil',e).state,'configured');assert.equal(diagnosticConfig('eduardo-brasil',{...e,PROXY_DIAGNOSTICS_EDUARDO_PHONE_NUMBER_ID:'9999999'}).state,'unconfigured');
});
