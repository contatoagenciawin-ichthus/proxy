import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createIchthusProxyReplayStore } from "../lib/ichthus-proxy-replay-pg-store.mjs";
import { consumeProxyPermitPostgresCommitted } from "../lib/ichthus-proxy-permit-replay.mjs";

// Integration only: a disposable CI database with a local, restricted login.
// No Neon, Meta, real credentials or app production connection is permitted.
const host=process.env.PGHOST;
const database=process.env.PGDATABASE;
const permitted=host==="127.0.0.1" && database==="proxy_g2_ephemeral" &&
  process.env.G2_TEST_PG_REQUIRE?.startsWith("/tmp/proxy-g2-node/");
test("G2 Node pg adapter: real committed replay, concurrent calls and role isolation",{
 skip:!permitted,
},async()=>{
 const require=createRequire(process.env.G2_TEST_PG_REQUIRE);
 const {Pool}=require("pg");
 const pool=new Pool({
   host,port:5432,database,
   user:"proxy_meta_ichthus_replay_login",
   password:"github_disposable_replay_only",max:14,
   connectionTimeoutMillis:3000,
 });
 const insertAndCommit=createIchthusProxyReplayStore({pool});
 const organizationId="1715a7b9-5209-4e7c-8439-84658061904f";
 const start=new Date(), expiry=new Date(start.getTime()+60000);
 const attempt=(permitId,nonceDigest)=>consumeProxyPermitPostgresCommitted({
   organizationId,permitId,nonceDigest,expiresAt:expiry,consumedAt:start,insertAndCommit,
 });
 try {
   const outcomes=await Promise.all(Array.from({length:12},()=>attempt("r".repeat(40),"3".repeat(64))));
   assert.equal(outcomes.filter(Boolean).length,1);
   assert.equal(outcomes.filter(x=>!x).length,11);
   const secondWave=await Promise.all(Array.from({length:9},(_,i)=>attempt(
     "s".repeat(39)+String(i+1),"4".repeat(64)
   )));
   assert.equal(secondWave.filter(Boolean).length,1);
   assert.equal(secondWave.filter(x=>!x).length,8);
   assert.equal(await attempt("r".repeat(40),"3".repeat(64)),false);
   // DB denies an unrelated organization through the restricted RLS writer.
   await assert.rejects(consumeProxyPermitPostgresCommitted({
     organizationId:"22222222-2222-4222-8222-222222222222",
     permitId:"u".repeat(40),nonceDigest:"6".repeat(64),
     expiresAt:expiry,consumedAt:start,insertAndCommit,
   }),/proxy_permit_store_unavailable/);
   // Privileged connections must never pass the adapter's role gate.
   const adminPool=new Pool({host,port:5432,database,user:"postgres",
     password:"github_test_only",max:1});
   try {
     await assert.rejects(consumeProxyPermitPostgresCommitted({
       organizationId,permitId:"v".repeat(40),nonceDigest:"7".repeat(64),
       expiresAt:expiry,consumedAt:start,
       insertAndCommit:createIchthusProxyReplayStore({pool:adminPool}),
     }),/proxy_permit_store_unavailable/);
   } finally {await adminPool.end()}
 } finally {await pool.end()}
});
