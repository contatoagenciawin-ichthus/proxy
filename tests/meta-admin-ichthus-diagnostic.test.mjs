import test from 'node:test'
import assert from 'node:assert/strict'
import {diagnoseIchthusMeta} from '../lib/meta-admin/ichthus-meta-diagnostic.mjs'
const env={PROXY_ICHTHUS_META_DIAGNOSTIC_ENABLED:'true',PROXY_ICHTHUS_META_DIAGNOSTIC_TOKEN:'a'.repeat(40),PROXY_ICHTHUS_META_GRAPH_VERSION:'v26.0'}
const response=(body,status=200)=>({ok:status>=200&&status<300,status,json:async()=>body})
const waba='107697061976892',phone='107612478652254',app='1952034255371331'
const fake=overrides=>async (url,options)=>{
 assert.equal(options.method,'GET')
 assert.equal(options.redirect,'error')
 assert.equal(options.headers.Authorization,'Bearer '+env.PROXY_ICHTHUS_META_DIAGNOSTIC_TOKEN)
 assert.ok(url.startsWith('https://graph.facebook.com/v26.0/'+waba))
 const suffix=url.split('?')[0]
 if(suffix.endsWith('/phone_numbers'))return overrides?.phone||response({data:[{id:phone,display_phone_number:'+55 19 99805-6642'}]})
 if(suffix.endsWith('/subscribed_apps'))return overrides?.subscription||response({data:[{id:app}]})
 return overrides?.waba||response({id:waba,name:'Ichthus'})
}
test('diagnostic is fail-closed without explicit flag and never invokes Graph',async()=>{
 let calls=0
 const r=await diagnoseIchthusMeta({env:{},fetchFn:async()=>{calls++;throw Error('must not run')}})
 assert.equal(r.checks.waba.status,'not_configured')
 assert.equal(r.checks.phone.status,'not_configured')
 assert.equal(calls,0)
})
test('read-only checks identify matching WABA, number and app subscription',async()=>{
 const r=await diagnoseIchthusMeta({env,fetchFn:fake()})
 assert.deepEqual(Object.values(r.checks).map(x=>x.status),['verified','verified','verified'])
 assert.equal(r.mutations,false)
})
test('access errors are not misreported as missing assets',async()=>{
 const r=await diagnoseIchthusMeta({env,fetchFn:fake({waba:response({error:{code:200,message:'private token details'}},403)})})
 assert.equal(r.checks.waba.status,'no_access')
 assert.equal(r.checks.phone.status,'blocked')
 assert.ok(!JSON.stringify(r).includes('private token details'))
})
test('partially paginated number list is inconclusive, not absent',async()=>{
 const r=await diagnoseIchthusMeta({env,fetchFn:fake({phone:response({data:[],paging:{next:'https://graph.facebook.com/next'}})})})
 assert.equal(r.checks.phone.status,'inconclusive')
})
test('complete returned lists can report missing phone or app accurately',async()=>{
 const r=await diagnoseIchthusMeta({env,fetchFn:fake({phone:response({data:[]}),subscription:response({data:[]})})})
 assert.equal(r.checks.phone.status,'not_found')
 assert.equal(r.checks.subscription.status,'not_found')
})
test('invalid Graph API response and network timeout remain errors',async()=>{
 const r=await diagnoseIchthusMeta({env,fetchFn:async()=>{throw Error('token=secret')}})
 assert.equal(r.checks.waba.status,'error')
 assert.ok(!JSON.stringify(r).includes('token=secret'))
})
