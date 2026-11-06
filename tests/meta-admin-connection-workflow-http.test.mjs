import test from 'node:test'
import assert from 'node:assert/strict'
import {handleConnectionWorkflowHttp} from '../lib/meta-admin/connection-workflow-http.mjs'
const organizationId='55555555-5555-4555-8555-555555555555'
const protocolId='77777777-7777-4777-8777-777777777777'
const endpoint=`https://proxy-preview.example.vercel.app/api/meta/admin/requests/workflow/${organizationId}/${protocolId}`
const env={VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'feat/g2-workflow-admin-integration-20261106',
 PROXY_REQUEST_WORKFLOW_ENABLED:'true',PROXY_CONNECTION_REQUEST_RECEIVER_ENABLED:'true'}
const actor={user:{id:'233162528'}}
const service={
 async read(x){return {workflow:{stage:'received',version:1},events:[],org:x.organizationId}},
 async apply(x){return {stage:'under_review',version:2,org:x.organizationId}}
}
const deps={env,resolveOperator:async()=>actor,getRuntime:()=>service}
const post=(url=endpoint,body={
 organizationId,protocolId,action:'stage_change',expectedVersion:1,payload:{stage:'under_review'}
},headers={})=>new Request(url,{method:'POST',
 headers:{origin:'https://proxy-preview.example.vercel.app','content-type':'application/json',...headers},
 body:JSON.stringify(body)})
test('default deny: other branch, production, or missing feature flag',async()=>{
 for(const e of [{...env,VERCEL_ENV:'production'},{...env,VERCEL_GIT_COMMIT_REF:'main'},
  {...env,PROXY_REQUEST_WORKFLOW_ENABLED:'false'}]){
  const result=await handleConnectionWorkflowHttp(new Request(endpoint),{...deps,env:e,
   getRuntime:()=>{throw Error('must not read the db')}})
  assert.equal(result.status,503)
 }
})
test('no operator session means no database access',async()=>{
 const r=await handleConnectionWorkflowHttp(new Request(endpoint),{...deps,
  resolveOperator:async()=>null,getRuntime:()=>{throw Error('not allowed')}})
 assert.equal(r.status,401)
})
test('reads receipt workflow with server-authenticated operator',async()=>{
 const r=await handleConnectionWorkflowHttp(new Request(endpoint),deps)
 assert.equal(r.status,200)
 const body=await r.json()
 assert.equal(body.data.workflow.stage,'received')
})
test('writes only route-bound data with trusted identity',async()=>{
 let got
 const r=await handleConnectionWorkflowHttp(post(),{...deps,
  getRuntime:()=>({...service,apply:async x=>{got=x;return {stage:'under_review',version:2}}})})
 assert.equal(r.status,200)
 assert.equal(got.actorId,'233162528')
 assert.equal(got.protocolId,protocolId)
})
test('denies cross-protocol mismatch, cross-origin and unknown fields',async()=>{
 const other='33333333-3333-4333-8333-333333333333'
 const altered={organizationId,protocolId:other,action:'note',expectedVersion:1,payload:{text:'ok'}}
 for(const req of [post(endpoint,altered),post(endpoint,undefined,{origin:'https://bad.example'}),
 post(endpoint,{organizationId,protocolId,action:'note',expectedVersion:1,payload:{text:'ok'},actorId:'1'})]){
  const r=await handleConnectionWorkflowHttp(req,{...deps,getRuntime:()=>{throw Error('must not read db')}})
  assert.ok([400,403].includes(r.status))
 }
})
test('stale version maps to conflict, other runtime errors fail closed',async()=>{
 const a=await handleConnectionWorkflowHttp(post(),{...deps,getRuntime:()=>({
  ...service,apply:async()=>{throw Error('workflow_version_conflict')}
 })})
 assert.equal(a.status,409)
 const b=await handleConnectionWorkflowHttp(post(),{...deps,getRuntime:()=>({
  ...service,apply:async()=>{throw Error('secret database issue')}
 })})
 assert.equal(b.status,503)
 assert.deepEqual(await b.json(),{error:'workflow_unavailable'})
})
