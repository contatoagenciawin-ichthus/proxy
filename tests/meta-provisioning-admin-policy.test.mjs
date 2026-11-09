import test from 'node:test'
import assert from 'node:assert/strict'
import {verifyProvisioningPost,validateProvisioningBody,readBoundedProvisioningJson} from '../lib/meta-provisioning/admin-request-policy.mjs'
const origin='https://app.proxyone.tech'
const valid={organizationId:'e9b935b6-3349-4b2c-970d-be8ad3bc243d',
 protocolId:'6419a70f-854d-4b7f-989a-25beaadabeed'}
function req({url=origin+'/api/meta/admin/provisioning/start',method='POST',
 headerOrigin=origin,site='same-origin',type='application/json',length='300'}={}){
 return new Request(url,{method,headers:{
  ...(headerOrigin===null?{}:{origin:headerOrigin}),
  'content-type':type,
  'sec-fetch-site':site,
  'content-length':length}})
}
test('admin mutating requests must have matching HTTPS host, strict origin and JSON',()=>{
 assert.equal(verifyProvisioningPost(req(),{origin}),true)
 for(const props of [
  {headerOrigin:null},{headerOrigin:'https://evil.example'},{site:'cross-site'},
  {url:'https://evil.example/api/meta/admin/provisioning/start'},
  {type:'application/x-www-form-urlencoded'},{length:'9000'},{method:'GET'}
 ]){
  assert.equal(verifyProvisioningPost(req(props),{origin}),false)
 }
 assert.equal(verifyProvisioningPost(req(),{origin:'http://app.proxyone.tech'}),false)
})
test('protocol metadata must be valid UUIDs, never freeform values',()=>{
 assert.deepEqual(validateProvisioningBody(valid),valid)
 for(const invalid of [null,[],{},{
  organizationId:'e9b935b6-3349-4b2c-970d-be8ad3bc243d',
  protocolId:'../another-tenant'
 },{...valid,organizationId:'not-an-id'}]){
  assert.throws(()=>validateProvisioningBody(invalid))
 }
})

test('POST JSON is bounded even when Content-Length is absent',async()=>{
 const body=JSON.stringify(valid)
 const request=new Request(origin+'/api/meta/admin/provisioning/start',{
  method:'POST',headers:{'content-type':'application/json'},body})
 assert.deepEqual(await readBoundedProvisioningJson(request),valid)
 const oversized=new Request(origin+'/api/meta/admin/provisioning/start',{
  method:'POST',headers:{'content-type':'application/json'},body:'x'.repeat(9000)})
 await assert.rejects(readBoundedProvisioningJson(oversized),/too_large/)
})
