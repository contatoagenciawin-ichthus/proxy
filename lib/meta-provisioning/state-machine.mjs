// Server-only deterministic rules for a multi-tenant assisted Meta onboarding.
// No AI classification, no Meta writes and no implicit activation.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const ID=/^[0-9]{5,24}$/
const PHASES=Object.freeze({
 requested:['operator_assigned','blocked'],
 operator_assigned:['awaiting_authorization','blocked'],
 awaiting_authorization:['authorization_received','blocked'],
 authorization_received:['credential_secured','blocked'],
 credential_secured:['diagnosing','blocked'],
 diagnosing:['ready_for_validation','blocked'],
 ready_for_validation:['active','blocked'],
 active:['blocked','revoked'],
 blocked:['operator_assigned','revoked'],
 revoked:[]
})
export function validateAssetBinding({request,asset,expectedAppId}={}){
 if(!request||!UUID.test(request.organizationId)||!UUID.test(request.protocolId))throw new Error('Unknown protocol')
 if(request.channel!=='whatsapp'||request.status!=='received_by_proxy')throw new Error('Request not eligible')
 if(!asset||![asset.wabaId,asset.phoneNumberId,asset.appId].every(v=>typeof v==='string'&&ID.test(v)))throw new Error('Invalid Meta assets')
 if(typeof expectedAppId!=='string'||!ID.test(expectedAppId)||asset.appId!==expectedAppId)throw new Error('Wrong Meta app')
 if(asset.organizationId!==request.organizationId||asset.protocolId!==request.protocolId)throw new Error('Cross-tenant or cross-protocol asset')
 return {organizationId:request.organizationId,protocolId:request.protocolId,wabaId:asset.wabaId,phoneNumberId:asset.phoneNumberId,appId:asset.appId}
}
export function transitionProvisioning({from,to,operatorId,evidence}={}){
 if(typeof from!=='string'||!Array.isArray(PHASES[from]))throw new Error('Unknown current phase')
 if(!PHASES[from].includes(to))throw new Error('Forbidden phase transition')
 if(typeof operatorId!=='string'||operatorId.length<3||operatorId.length>128)throw new Error('Operator required')
 if(to==='credential_secured'&&(!evidence?.tokenStored||!evidence?.matchingAsset))throw new Error('Credential evidence required')
 if(to==='ready_for_validation'&&(!evidence?.wabaVerified||!evidence?.phoneVerified||!evidence?.subscriptionVerified))throw new Error('Meta checks required')
 if(to==='active'&&(!evidence?.inboundMessage||!evidence?.humanReply||!evidence?.tenantIsolation||!evidence?.callbackVerified))throw new Error('End-to-end validation required')
 return Object.freeze({from,to,operatorId})
}
export const allowedProvisioningNext=(phase)=>[...(PHASES[phase]||[])]
