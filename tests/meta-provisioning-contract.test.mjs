import test from 'node:test'
import assert from 'node:assert/strict'
import {randomBytes} from 'node:crypto'
import {sealMetaCredential,openMetaCredential,sameFingerprint} from '../lib/meta-provisioning/credential-envelope.mjs'
import {validateAssetBinding,transitionProvisioning,allowedProvisioningNext} from '../lib/meta-provisioning/state-machine.mjs'
const organizationId='e9b935b6-3349-4b2c-970d-be8ad3bc243d'
const protocolId='6419a70f-854d-4b7f-989a-25beaadabeed'
const identity={organizationId,protocolId,wabaId:'107697061976892',phoneNumberId:'107612478652254',appId:'1952034255371331'}
const key=randomBytes(32).toString('hex')
const token='test-only-opaque-meta-token-value-and-entropy'
test('platform key seals token, no browser-readable plaintext and round-trip is exact',()=>{
 const envelope=sealMetaCredential({identity,accessToken:token,rootKeyHex:key})
 assert.equal(envelope.envelopeVersion,1)
 assert.ok(!JSON.stringify(envelope).includes(token))
 assert.equal(openMetaCredential({identity,envelope,rootKeyHex:key}),token)
 assert.ok(sameFingerprint(envelope.fingerprint,envelope.fingerprint))
 assert.ok(!sameFingerprint(envelope.fingerprint,'bad'))
})
test('cryptographic authenticated context forbids opening under another org, protocol or WABA',()=>{
 const envelope=sealMetaCredential({identity,accessToken:token,rootKeyHex:key})
 for(const changed of [{organizationId:'f9b935b6-3349-4b2c-970d-be8ad3bc243d'},{protocolId:'7419a70f-854d-4b7f-989a-25beaadabeed'},{wabaId:'269938242876600'},{phoneNumberId:'280401731826708'}])
  assert.throws(()=>openMetaCredential({identity:{...identity,...changed},envelope,rootKeyHex:key}))
 assert.throws(()=>openMetaCredential({identity,envelope:{...envelope,tag:Buffer.alloc(16).toString('base64url')},rootKeyHex:key}))
})
test('root key misconfiguration fails closed',()=>{
 assert.throws(()=>sealMetaCredential({identity,accessToken:token,rootKeyHex:'short'}))
 assert.throws(()=>openMetaCredential({identity,envelope:sealMetaCredential({identity,accessToken:token,rootKeyHex:key}),rootKeyHex:randomBytes(32).toString('hex')}))
})
test('source protocol must be genuine and matching meta app, org and protocol',()=>{
 const request={organizationId,protocolId,channel:'whatsapp',status:'received_by_proxy'}
 assert.deepEqual(validateAssetBinding({request,asset:{...identity},expectedAppId:identity.appId}),identity)
 assert.throws(()=>validateAssetBinding({request,asset:{...identity,organizationId:'f9b935b6-3349-4b2c-970d-be8ad3bc243d'},expectedAppId:identity.appId}))
 assert.throws(()=>validateAssetBinding({request,asset:{...identity,appId:'269938242876600'},expectedAppId:identity.appId}))
 assert.throws(()=>validateAssetBinding({request:{...request,status:'revoked'},asset:identity,expectedAppId:identity.appId}))
})
test('state cannot jump from authorization to active without all operational evidence',()=>{
 assert.throws(()=>transitionProvisioning({from:'requested',to:'active',operatorId:'operator-123'}))
 assert.throws(()=>transitionProvisioning({from:'authorization_received',to:'credential_secured',operatorId:'operator-123'}))
 assert.throws(()=>transitionProvisioning({from:'ready_for_validation',to:'active',operatorId:'operator-123',evidence:{inboundMessage:true,humanReply:true,tenantIsolation:true}}))
 assert.deepEqual(transitionProvisioning({from:'ready_for_validation',to:'active',operatorId:'operator-123',evidence:{inboundMessage:true,humanReply:true,tenantIsolation:true,callbackVerified:true}}),{from:'ready_for_validation',to:'active',operatorId:'operator-123'})
 assert.deepEqual(allowedProvisioningNext('revoked'),[])
})
