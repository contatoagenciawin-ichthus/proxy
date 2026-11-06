import test from 'node:test'
import assert from 'node:assert/strict'
import {findAdminRequestDetail} from '../lib/meta-admin/connection-request-detail.mjs'
const organizationId='55555555-5555-4555-8555-555555555555',protocolId='77777777-7777-4777-8777-777777777777'
const inbound={state:'ready',requests:[{organizationId,protocolId,product:'proxy-relationship',status:'received_by_proxy',channel:'whatsapp',receivedAt:'2026-11-06T14:19:20.896Z'}]}
test('finds only an exact tenant/protocol pair from server-side allowlisted receipts',()=>{
 const ok=findAdminRequestDetail({inbound,organizationId,protocolId})
 assert.equal(ok.state,'ready');assert.equal(ok.request.protocolId,protocolId)
 assert.equal(findAdminRequestDetail({inbound,organizationId:'11111111-1111-4111-8111-111111111111',protocolId}).state,'not_found')
 assert.equal(findAdminRequestDetail({inbound,organizationId,protocolId:'not-a-uuid'}).state,'invalid')
})
test('distinguishes disabled, unavailable and missing records',()=>{
 assert.equal(findAdminRequestDetail({inbound:{state:'disabled'},organizationId,protocolId}).state,'disabled')
 assert.equal(findAdminRequestDetail({inbound:{state:'unavailable'},organizationId,protocolId}).state,'unavailable')
 assert.equal(findAdminRequestDetail({inbound:{state:'ready',requests:[]},organizationId,protocolId}).state,'not_found')
})
