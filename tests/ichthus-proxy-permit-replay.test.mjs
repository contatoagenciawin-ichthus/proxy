import test from "node:test";
import assert from "node:assert/strict";
import { issueIchthusProxyExchangePermit } from "../lib/ichthus-crm-exchange-permit.mjs";
import { consumeIchthusProxyPermit, consumeProxyPermitPostgresCommitted } from "../lib/ichthus-proxy-permit-replay.mjs";

const organizationId = "1715a7b9-5209-4e7c-8439-84658061904f";
const configId = "3237839906603757";
const secret = "ONLY_FOR_TESTS_proxy_permit_secret_32_characters";
const now = 1792410000000;
const permit = issueIchthusProxyExchangePermit({
 organizationId,configId,nonceDigest:"a".repeat(64),permitId:"unique_example_permit_id_32_random_chars",secret,now,
});
const base={permit,secret,expectedOrganizationId:organizationId,expectedConfigId:configId,now:now+1000};

function persistedStore() {
 const rows=new Set();
 return async ({organizationId,permitId})=>{
  const key=organizationId+":"+permitId;
  // Commit atomically before the awaited call completes; this models a DB
  // unique constraint, NOT an in-memory production substitute.
  if(rows.has(key))return false;
  rows.add(key);
  return true;
 };
}

test("Proxy consumes the verified permit once and never passes the raw permit downstream",async()=>{
 const consumeOnce=persistedStore();
 const verified=await consumeIchthusProxyPermit({...base,consumeOnce});
 assert.deepEqual(verified,{
  organizationId,wabaId:"107697061976892",phoneNumberId:"107612478652254",
  configId,nonceDigest:"a".repeat(64),
 });
 assert.equal(Object.hasOwn(verified,"permitId"),false);
 await assert.rejects(consumeIchthusProxyPermit({...base,consumeOnce}),/proxy_permit_already_consumed/);
});

test("Proxy concurrent requests have precisely one accepted consumption",async()=>{
 const consumeOnce=persistedStore();
 const results=await Promise.allSettled(Array.from({length:12},()=>consumeIchthusProxyPermit({...base,consumeOnce})));
 assert.equal(results.filter(x=>x.status==="fulfilled").length,1);
 assert.equal(results.filter(x=>x.status==="rejected").length,11);
});

test("Proxy validates signature, tenant and expiry BEFORE touching its store",async()=>{
 let called=0;
 const consumeOnce=async()=>{called++;return true;};
 for(const changes of [
  {expectedOrganizationId:"22222222-2222-4222-8222-222222222222"},
  {expectedConfigId:"1234567890"},{now:now+60000},
  {secret:"other_secret_long_enough_for_testing_xxxxxxxxx"},
 ])await assert.rejects(consumeIchthusProxyPermit({...base,...changes,consumeOnce}),/proxy_exchange_permit_invalid/);
 assert.equal(called,0);
});

test("Proxy always fails closed for unavailable or crashing replay storage",async()=>{
 await assert.rejects(consumeIchthusProxyPermit(base),/proxy_permit_store_unavailable/);
 await assert.rejects(consumeIchthusProxyPermit({...base,consumeOnce:async()=>{throw Error("db_down")}}),/proxy_permit_store_unavailable/);
});

test("PostgreSQL adapter contract uses unique insert, never an unlocked read-then-write",async()=>{
 let received;
 const ok=await consumeProxyPermitPostgresCommitted({
  organizationId,permitId:"example_permit_32_character_token_xx",
  nonceDigest:"a".repeat(64),expiresAt:new Date(now+60000),consumedAt:new Date(now),
  insertAndCommit:async operation=>{received=operation;return {rowCount:1};},
 });
 assert.equal(ok,true);
 assert.match(received.sql,/on conflict \(organization_id, permit_id\) do nothing/);
 assert.match(received.sql,/returning permit_id/);
 assert.equal(received.params[0],organizationId);
});
