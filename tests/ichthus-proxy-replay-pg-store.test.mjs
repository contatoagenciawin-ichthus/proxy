import test from "node:test";
import assert from "node:assert/strict";
import { createIchthusProxyReplayStore } from "../lib/ichthus-proxy-replay-pg-store.mjs";
import { consumeProxyPermitPostgresCommitted } from "../lib/ichthus-proxy-permit-replay.mjs";

const role={rows:[{role:"proxy_meta_ichthus_replay_login",superuser:false,bypassrls:false}]};
const base={
  organizationId:"1715a7b9-5209-4e7c-8439-84658061904f",
  permitId:"a".repeat(40),nonceDigest:"b".repeat(64),
  expiresAt:new Date("2026-10-20T18:01:00Z"),
  consumedAt:new Date("2026-10-20T18:00:00Z"),
};
function fakePool({unsafeRole=false,inserted=1,fail="",failedRollback=false}={}){
  const calls=[];let released=0;
  const pool={connect:async()=>({
    query:async(sql,params)=>{
      calls.push({sql,params});
      if (fail && sql.includes(fail))throw Error("simulated_failure");
      if (failedRollback && sql==="ROLLBACK")throw Error("rollback_failed");
      if (sql.startsWith("select current_user"))return unsafeRole?{rows:[{role:"neondb_owner",superuser:false,bypassrls:true}]}:role;
      if (sql.startsWith("insert into"))return {rowCount:inserted};
      return {rows:[],rowCount:null};
    },
    release:()=>{released++},
  })};
  return {pool,calls,get released(){return released}};
}
async function consume(testPool,params=base) {
  return consumeProxyPermitPostgresCommitted({...params,insertAndCommit:createIchthusProxyReplayStore({pool:testPool.pool})});
}

test("G2 PG adapter checks restricted LOGIN and commits before acknowledging accepted insert",async()=>{
  const db=fakePool();
  assert.equal(await consume(db),true);
  assert.deepEqual(db.calls.map(c=>c.sql.startsWith("select")?"ROLE":c.sql.startsWith("insert")?"INSERT":c.sql),
    ["ROLE","BEGIN","INSERT","COMMIT"]);
  assert.equal(db.released,1);
});
test("G2 PG adapter returns replay only when INSERT is committed with no row",async()=>{
  const db=fakePool({inserted:0});
  assert.equal(await consume(db),false);
  assert.deepEqual(db.calls.slice(-2).map(c=>c.sql.startsWith("insert")?"INSERT":c.sql),["INSERT","COMMIT"]);
});
test("G2 PG adapter refuses privileged role before opening transaction",async()=>{
  const db=fakePool({unsafeRole:true});
  await assert.rejects(consume(db),/proxy_permit_store_unavailable/);
  assert.equal(db.calls.length,1);
  assert.equal(db.released,1);
});
test("G2 PG adapter rolls back failed insert and reports unavailability",async()=>{
  const db=fakePool({fail:"insert into",failedRollback:true});
  await assert.rejects(consume(db),/proxy_permit_store_unavailable/);
  assert.ok(db.calls.some(x=>x.sql==="ROLLBACK"));
  assert.ok(!db.calls.some(x=>x.sql==="COMMIT"));
  assert.equal(db.released,1);
});
test("G2 PG adapter fails closed when COMMIT errors; never reports replay or success",async()=>{
  const db=fakePool({fail:"COMMIT"});
  await assert.rejects(consume(db),/proxy_permit_store_unavailable/);
  assert.ok(db.calls.some(x=>x.sql==="ROLLBACK"));
  assert.equal(db.released,1);
});
test("G2 PG adapter rejects injected/nonconforming SQL before transaction",async()=>{
  const db=fakePool();
  const insertAndCommit=createIchthusProxyReplayStore({pool:db.pool});
  await assert.rejects(insertAndCommit({sql:"delete from proxy_meta.ichthus_exchange_permit_uses",params:[]}),/proxy_permit_store_unavailable/);
  assert.equal(db.calls.length,0);
});
