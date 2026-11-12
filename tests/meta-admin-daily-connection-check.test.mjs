import test from 'node:test'
import assert from 'node:assert/strict'
import {authorizedDailyCheck,executeDailyCheck,summarizeMetaCheck} from '../lib/meta-admin/daily-connection-check.mjs'
const secret='synthetic-test-cron-auth-secret-at-least-32-characters'
const request=new Request('https://app.proxyone.tech/api/meta/admin/daily-connection-check',{headers:{authorization:'Bearer '+secret}})
test('cron endpoint requires exact bearer token',()=>{
 assert.equal(authorizedDailyCheck(request,secret),true)
 assert.equal(authorizedDailyCheck(request,'different-long-test-secret-at-least-32-characters'),false)
 assert.equal(authorizedDailyCheck(new Request(request.url),secret),false)
 assert.equal(authorizedDailyCheck(new Request(request.url,{method:'POST',headers:{authorization:'Bearer '+secret}}),secret),false)
})
test('Meta verified identifiers are conservatively summarized',()=>{
 const ok={checks:{waba:{status:'verified'},phone:{status:'verified'},subscription:{status:'verified'},callback:{status:'verified'}}}
 assert.equal(summarizeMetaCheck(ok).result,'confirmed')
 assert.equal(summarizeMetaCheck({...ok,checks:{...ok.checks,callback:{status:'inconclusive'}}}).result,'inconclusive')
 assert.equal(summarizeMetaCheck({...ok,checks:{...ok.checks,subscription:{status:'not_found'}}}).result,'attention')
 assert.equal(summarizeMetaCheck(null).result,'inconclusive')
})
test('job is idempotent per UTC date, without extra Graph queries',async()=>{
 const when=new Date('2026-11-12T09:00:00Z')
 let graph=0,persisted=0
 const args={now:when,readPrevious:async()=>({checkedAt:'2026-11-12T02:00:00Z'}),
  diagnose:async()=>{graph++},persist:async()=>{persisted++}}
 const result=await executeDailyCheck(args)
 assert.equal(result.status,'already_checked')
 assert.equal(graph,0);assert.equal(persisted,0)
})
test('a failed Graph read is recorded as inconclusive, never disconnected',async()=>{
 let saved
 const result=await executeDailyCheck({now:new Date('2026-11-12T09:00:00Z'),readPrevious:async()=>null,
  diagnose:async()=>{throw Error('no Meta reachability')},persist:async x=>{saved=x}})
 assert.equal(result.result,'inconclusive')
 assert.equal(saved.result,'inconclusive')
 assert.equal(saved.organizationId,'e9b935b6-3349-4b2c-970d-be8ad3bc243d')
 assert.equal(Object.hasOwn(saved,'token'),false)
})
