import test from "node:test";
import assert from "node:assert/strict";
import { issueIchthusProxyOAuthRequest,verifyIchthusProxyOAuthRequest } from "../lib/ichthus-proxy-oauth-request-binding.mjs";
import { issueIchthusProxyExchangePermit } from "../lib/ichthus-crm-exchange-permit.mjs";
import { executeBoundIchthusProxyExchange } from "../lib/ichthus-proxy-bound-exchange.mjs";

const organizationId="1715a7b9-5209-4e7c-8439-84658061904f";
const configId="3237839906603757",now=1792500000000;
const secret="TEST_ONLY_PERMIT_SECRET_ABC_1234567890";
const requestSecret="TEST_ONLY_DIFFERENT_REQUEST_SECRET_XYZ_1234567890";
const code="FICTIONAL_META_CODE_FOR_TESTING_NO_NETWORK";
const permit=issueIchthusProxyExchangePermit({
 organizationId,configId,nonceDigest:"a".repeat(64),
 permitId:"b".repeat(40),secret,now,
});
const binding=issueIchthusProxyOAuthRequest({
 permit,code,requestId:"c".repeat(40),secret:requestSecret,now,
});
const base={
 binding,requestSecret,permit,secret,code,expectedOrganizationId:organizationId,
 expectedConfigId:configId,now:now+1000,
};
test("request signature binds the exact permit and code, without revealing either",()=>{
 const value=verifyIchthusProxyOAuthRequest({
  binding,permit,code,secret:requestSecret,now:now+1000,
 });
 assert.equal(value.requestId,"c".repeat(40));
 assert.ok(!binding.includes(code));
 assert.ok(!binding.includes(permit));
 for(const options of [
  {code:"OTHER_FICTIONAL_CODE_NO_REAL_META"},
  {permit:permit.slice(0,-1)+"A"},
  {secret:"TEST_ONLY_INCORRECT_SECRET_LONG_ENOUGH_123"},
  {now:now+60000},
 ])assert.throws(()=>verifyIchthusProxyOAuthRequest({
   binding,permit,code,secret:requestSecret,now:now+1000,...options,
 }),/proxy_oauth_request_invalid/);
});
test("bound exchange denies code substitution before touching replay store or provider",async()=>{
 let stored=0,provider=0;
 await assert.rejects(executeBoundIchthusProxyExchange({
  ...base,code:"DIFFERENT_FICTIONAL_META_CODE_123",
  consumeOnce:async()=>{stored++;return true},
  exchangeCode:async()=>{provider++},
 }),/proxy_oauth_request_invalid/);
 assert.equal(stored,0);
 assert.equal(provider,0);
});
test("valid bound exchange consumes exactly once before invoking fake provider",async()=>{
 const events=[],used=new Set();
 const consumeOnce=async({nonceDigest})=>{
  events.push("commit");
  if(used.has(nonceDigest))return false;
  used.add(nonceDigest);return true;
 };
 const exchangeCode=async({code:passedCode})=>{
  events.push("simulated-exchange");
  assert.equal(passedCode,code);
 };
 await executeBoundIchthusProxyExchange({...base,consumeOnce,exchangeCode});
 assert.deepEqual(events,["commit","simulated-exchange"]);
 await assert.rejects(executeBoundIchthusProxyExchange({...base,consumeOnce,exchangeCode}),/proxy_permit_already_consumed/);
 assert.deepEqual(events,["commit","simulated-exchange","commit"]);
});
