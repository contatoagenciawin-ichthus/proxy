import test from "node:test";
import assert from "node:assert/strict";
import { issueIchthusProxyExchangePermit } from "../lib/ichthus-crm-exchange-permit.mjs";
import { issueIchthusProxyOAuthRequest } from "../lib/ichthus-proxy-oauth-request-binding.mjs";
import { handleIchthusOAuthExchangeRequest } from "../lib/ichthus-proxy-oauth-controller.mjs";

const org="1715a7b9-5209-4e7c-8439-84658061904f";
const configId="3237839906603757",now=1792500000000;
const permitSecret="TEST_ONLY_permit_signing_key_20261020_123456";
const requestSecret="TEST_ONLY_transport_signing_key_20261020_123456";
const code="SYNTHETIC_META_AUTHORIZATION_CODE_123456";
const permit=issueIchthusProxyExchangePermit({
 organizationId:org,configId,nonceDigest:"a".repeat(64),
 permitId:"b".repeat(40),secret:permitSecret,now,
});
const binding=issueIchthusProxyOAuthRequest({
 permit,code,requestId:"c".repeat(40),secret:requestSecret,now,
});
const request={
 method:"POST",path:"/api/meta/ichthus/oauth/exchange",
 headers:{"content-type":"application/json"},
 rawBody:JSON.stringify({binding,permit,code}),
};
const base={
 request,enabled:true,verifiedServiceIdentity:"ichthus-crm-server",
 permitSecret,requestSecret,configId,now:now+1000,
};
test("G2 disabled by default even for correctly signed server requests",async()=>{
 let reads=0;
 await assert.rejects(handleIchthusOAuthExchangeRequest({
  ...base,enabled:false,consumeOnce:async()=>{reads++;return true},
  exchangeCode:async()=>{},
 }),/ichthus_proxy_controller_unavailable/);
 assert.equal(reads,0);
});
test("G2 authenticated server request consumes before mock code exchange",async()=>{
 const steps=[];
 const result=await handleIchthusOAuthExchangeRequest({
  ...base,
  consumeOnce:async()=>{steps.push("persisted");return true},
  exchangeCode:async()=>{steps.push("mock_meta");},
 });
 assert.deepEqual(steps,["persisted","mock_meta"]);
 assert.equal(result.organizationId,org);
 assert.equal(Object.hasOwn(result,"code"),false);
});
test("G2 rejects browser-shaped or altered request without DB or provider contact",async()=>{
 let reads=0,calls=0;
 const run=async changes=>handleIchthusOAuthExchangeRequest({
  ...base,
  consumeOnce:async()=>{reads++;return true},
  exchangeCode:async()=>{calls++},
  ...changes,
 });
 const invalid=[
  {verifiedServiceIdentity:null},
  {verifiedServiceIdentity:"untrusted-browser"},
  {configId:"1234567890"},
  {request:{...request,method:"GET"}},
  {request:{...request,path:"/api/meta/onboarding/exchange"}},
  {request:{...request,headers:{"content-type":"text/plain"}}},
  {request:{...request,headers:{"content-type":"application/json",cookie:"sid=1"}}},
  {request:{...request,headers:{"content-type":"application/json",origin:"https://example.invalid"}}},
  {request:{...request,rawBody:"x".repeat(13000)}},
  {request:{...request,rawBody:JSON.stringify({binding,permit,code,organizationId:org})}},
  {request:{...request,rawBody:JSON.stringify({binding,permit,code:code+"altered"})}},
 ];
 for(const changes of invalid)await assert.rejects(run(changes));
 assert.equal(reads,0);
 assert.equal(calls,0);
});
test("G2 duplicate request never recontacts mock provider",async()=>{
 const seen=new Set();
 let calls=0;
 const options={
  ...base,
  consumeOnce:async({nonceDigest})=>{
   if(seen.has(nonceDigest))return false;
   seen.add(nonceDigest);return true;
  },
  exchangeCode:async()=>{calls++},
 };
 await handleIchthusOAuthExchangeRequest(options);
 await assert.rejects(handleIchthusOAuthExchangeRequest(options),/proxy_permit_already_consumed/);
 assert.equal(calls,1);
});
