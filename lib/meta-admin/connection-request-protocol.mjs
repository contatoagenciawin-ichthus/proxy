import { createHmac, timingSafeEqual } from 'node:crypto'
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const PRODUCTS=new Set(['proxy-relationship'])
const STATES=new Set(['registered'])
export function validateConnectionRequest(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw new TypeError('invalid_payload')
 const keys=Object.keys(value).sort()
 if(keys.join(',')!=='channel,organizationId,product,protocolId,status,version')throw new TypeError('invalid_payload')
 if(!UUID.test(value.organizationId)||!UUID.test(value.protocolId)||!PRODUCTS.has(value.product)||value.channel!=='whatsapp'||!STATES.has(value.status)||value.version!==1)throw new TypeError('invalid_payload')
 return Object.freeze({product:value.product,organizationId:value.organizationId,protocolId:value.protocolId,channel:'whatsapp',status:'registered',version:1})
}
export function canonicalRequest(value){
 const x=validateConnectionRequest(value)
 return JSON.stringify([x.product,x.organizationId,x.protocolId,x.channel,x.status,x.version])
}
export function signConnectionRequest({body,timestamp,secret}){
 if(typeof secret!=='string'||secret.length<32)throw new Error('service_not_configured')
 if(!Number.isSafeInteger(timestamp)||timestamp<=0)throw new TypeError('invalid_timestamp')
 return createHmac('sha256',secret).update(timestamp+'\n'+canonicalRequest(body)).digest('hex')
}
export function verifyConnectionRequest({body,timestamp,signature,secret,allowedTenants,now=Date.now()}){
 if(typeof secret!=='string'||secret.length<32)throw new Error('service_not_configured')
 if(!Number.isSafeInteger(timestamp)||Math.abs(now-timestamp)>5*60*1000)throw new Error('stale_signature')
 if(typeof signature!=='string'||!/^[0-9a-f]{64}$/i.test(signature))throw new Error('invalid_signature')
 const normalized=validateConnectionRequest(body)
 if(!Array.isArray(allowedTenants)||!allowedTenants.includes(normalized.organizationId))throw new Error('tenant_not_allowed')
 const expected=signConnectionRequest({body:normalized,timestamp,secret})
 if(!timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(signature,'hex')))throw new Error('invalid_signature')
 return normalized
}
// Signature proves the trusted sender and freshness; durable database uniqueness
// enforces replay-idempotency. This module never reads/writes Meta credentials.
export async function receiveConnectionRequest({body,timestamp,signature,secret,allowedTenants,store,now}){
 if(typeof store?.saveReceipt!=='function')throw new Error('receiver_storage_not_configured')
 const request=verifyConnectionRequest({body,timestamp,signature,secret,allowedTenants,now})
 const receipt=await store.saveReceipt(request)
 if(receipt?.protocolId!==request.protocolId||receipt?.organizationId!==request.organizationId||receipt?.product!==request.product)throw new Error('invalid_receipt')
 return {protocolId:receipt.protocolId,organizationId:receipt.organizationId,product:receipt.product,receiptStatus:'received_by_proxy'}
}
