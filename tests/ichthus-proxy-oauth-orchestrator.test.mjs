import test from "node:test";
import assert from "node:assert/strict";
import { issueIchthusProxyExchangePermit } from "../lib/ichthus-crm-exchange-permit.mjs";
import { executeIchthusProxyExchange } from "../lib/ichthus-proxy-oauth-orchestrator.mjs";

const organizationId="1715a7b9-5209-4e7c-8439-84658061904f";
const configId="3237839906603757";
const secret="TEST_ONLY_simulated_proxy_handoff_secret_123456789";
const now=1792490400000;
const permit=issueIchthusProxyExchangePermit({
 organizationId,configId,nonceDigest:"e".repeat(64),
 permitId:"f".repeat(40),secret,now,
});
const base={permit,secret,expectedOrganizationId:organizationId,expectedConfigId:configId,code:"SIMULATED_OAUTH_CODE_NO_META",now:now+1000};
function durableStub() {
 const used=new Set();
 const consumeOnce=async({organizationId,permitId,nonceDigest})=>{
  const key=organizationId+":"+nonceDigest;
  if(used.has(key))return false;
  used.add(key);
  return true;
 };
 return consumeOnce;
}
test("G2 simulated exchange starts only after permit was consumed",async()=>{
 const events=[];
 const consumeOnce=durableStub();
 const result=await executeIchthusProxyExchange({
  ...base,
  consumeOnce:async input=>{events.push("commit");return consumeOnce(input)},
  exchangeCode:async({code,authorization})=>{
   events.push("exchange");
   assert.equal(code,base.code);
   assert.equal(authorization.wabaId,"107697061976892");
  },
 });
 assert.deepEqual(events,["commit","exchange"]);
 assert.equal(result.consumed,true);
 assert.equal(Object.hasOwn(result,"code"),false);
 await assert.rejects(executeIchthusProxyExchange({
  ...base,consumeOnce,exchangeCode:async()=>{throw Error("should_not_call")},
 }),/proxy_permit_already_consumed/);
});
test("G2 concurrent mock exchanges call provider at most once",async()=>{
 let calls=0;
 const consumeOnce=durableStub();
 const promises=Array.from({length:15},()=>executeIchthusProxyExchange({
  ...base,consumeOnce,
  exchangeCode:async()=>{calls++;return {accessToken:"FICTIONAL_TOKEN"};},
 }));
 const outcomes=await Promise.allSettled(promises);
 assert.equal(calls,1);
 assert.equal(outcomes.filter(x=>x.status==="fulfilled").length,1);
 assert.equal(outcomes.filter(x=>x.status==="rejected").length,14);
});
test("G2 denies wrong org, config, expiry, invalid code and missing store before exchange",async()=>{
 let calls=0,consumptions=0;
 const exchangeCode=async()=>{calls++};
 const consumeOnce=async()=>{consumptions++;return true};
 for(const changes of [
  {expectedOrganizationId:"22222222-2222-4222-8222-222222222222"},
  {expectedConfigId:"1234567890"},
  {now:now+60000},{code:""},
  {code:"contains white space"},
  {code:"x".repeat(4100)},
 ])await assert.rejects(executeIchthusProxyExchange({...base,...changes,consumeOnce,exchangeCode}));
 assert.equal(calls,0);
 assert.equal(consumptions,0);
 await assert.rejects(executeIchthusProxyExchange({...base,exchangeCode}),/proxy_permit_store_unavailable/);
 assert.equal(calls,0);
});
test("G2 Meta provider failure does not undo consumed permit",async()=>{
 const consumeOnce=durableStub();
 await assert.rejects(executeIchthusProxyExchange({
  ...base,consumeOnce,exchangeCode:async()=>{throw Error("simulated_graph_unavailable")},
 }),/simulated_graph_unavailable/);
 let calls=0;
 await assert.rejects(executeIchthusProxyExchange({
  ...base,consumeOnce,exchangeCode:async()=>{calls++},
 }),/proxy_permit_already_consumed/);
 assert.equal(calls,0);
});
