import {createCipheriv,createDecipheriv,createHash,randomBytes,timingSafeEqual} from 'node:crypto'

// Token protection runs exclusively server-side. Never serialize raw OAuth tokens to
// browser, logs, audit history or ordinary connection metadata.
// Root master key is platform-level; no environment secret is created per tenant.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const META_ID=/^[0-9]{5,24}$/
export const TOKEN_ENVELOPE_VERSION=1

export function validateCredentialIdentity(identity){
 if(!identity||typeof identity!=='object')throw new TypeError('Invalid credential identity')
 const {organizationId,protocolId,wabaId,phoneNumberId,appId}=identity
 if(!UUID.test(organizationId)||!UUID.test(protocolId)||![wabaId,phoneNumberId,appId].every(s=>typeof s==='string'&&META_ID.test(s)))
  throw new TypeError('Invalid connection identity')
 return {organizationId,protocolId,wabaId,phoneNumberId,appId}
}

function keyFromEnvironment(value){
 if(typeof value!=='string'||!/^([a-f0-9]{64})$/i.test(value))throw new Error('Platform encryption key unavailable')
 return Buffer.from(value,'hex')
}
function context(identity){return Buffer.from(JSON.stringify(validateCredentialIdentity(identity)),'utf8')}
export function sealMetaCredential({identity,accessToken,rootKeyHex,keyVersion=1}){
 if(typeof accessToken!=='string'||accessToken.length<20||accessToken.length>8192)throw new TypeError('Invalid token')
 if(!Number.isSafeInteger(keyVersion)||keyVersion<1)throw new TypeError('Invalid key version')
 const key=keyFromEnvironment(rootKeyHex)
 const iv=randomBytes(12)
 const cipher=createCipheriv('aes-256-gcm',key,iv)
 cipher.setAAD(context(identity))
 const encrypted=Buffer.concat([cipher.update(accessToken,'utf8'),cipher.final()])
 return Object.freeze({
  envelopeVersion:TOKEN_ENVELOPE_VERSION,
  keyVersion,
  iv:iv.toString('base64url'),
  ciphertext:encrypted.toString('base64url'),
  tag:cipher.getAuthTag().toString('base64url'),
  fingerprint:createHash('sha256').update(accessToken).digest('hex').slice(0,16)
 })
}
export function openMetaCredential({identity,envelope,rootKeyHex}){
 if(envelope?.envelopeVersion!==TOKEN_ENVELOPE_VERSION||typeof envelope.iv!=='string'||typeof envelope.ciphertext!=='string'||typeof envelope.tag!=='string')throw new Error('Invalid envelope')
 const key=keyFromEnvironment(rootKeyHex)
 const iv=Buffer.from(envelope.iv,'base64url')
 const tag=Buffer.from(envelope.tag,'base64url')
 const ciphertext=Buffer.from(envelope.ciphertext,'base64url')
 if(iv.length!==12||tag.length!==16||ciphertext.length<20||ciphertext.length>8192)throw new Error('Invalid envelope')
 const decipher=createDecipheriv('aes-256-gcm',key,iv)
 decipher.setAAD(context(identity))
 decipher.setAuthTag(tag)
 return Buffer.concat([decipher.update(ciphertext),decipher.final()]).toString('utf8')
}
export function sameFingerprint(first,second){
 if(typeof first!=='string'||typeof second!=='string'||!/^[a-f0-9]{16}$/.test(first)||!/^[a-f0-9]{16}$/.test(second))return false
 return timingSafeEqual(Buffer.from(first,'hex'),Buffer.from(second,'hex'))
}
