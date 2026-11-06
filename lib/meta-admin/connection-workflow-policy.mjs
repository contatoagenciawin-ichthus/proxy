// Pure validation for future operator mutation endpoints. No DB or Meta side effects.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const STAGES=new Set(['received','under_review','awaiting_customer',
 'authorization_pending','technical_validation','operational_validation',
 'active','suspended','cancelled'])
const TRANSITIONS=Object.freeze({
 received:['under_review','cancelled'],
 under_review:['awaiting_customer','authorization_pending','suspended','cancelled'],
 awaiting_customer:['under_review','authorization_pending','cancelled'],
 authorization_pending:['under_review','technical_validation','suspended','cancelled'],
 technical_validation:['authorization_pending','operational_validation','suspended'],
 operational_validation:['technical_validation','active','suspended'],
 active:['suspended'],
 suspended:['under_review','cancelled'],
 cancelled:[]
})
export function validateWorkflowMutation({organizationId,protocolId,actorId,currentStage,expectedVersion,action,payload}={}){
 if(!UUID.test(organizationId||'')||!UUID.test(protocolId||''))throw Error('invalid_identity')
 if(typeof actorId!=='string'||!/^\d{1,32}$/.test(actorId))throw Error('invalid_operator')
 if(!STAGES.has(currentStage)||!Number.isSafeInteger(expectedVersion)||expectedVersion<1)throw Error('invalid_workflow_version')
 if(!payload||typeof payload!=='object'||Array.isArray(payload))throw Error('invalid_payload')
 const keys=Object.keys(payload)
 const exact=allowed=>keys.length===allowed.length&&keys.every(k=>allowed.includes(k))
 if(action==='assign'){
  if(!exact(['operatorId'])||typeof payload.operatorId!=='string'||!/^\d{1,32}$/.test(payload.operatorId))throw Error('invalid_assignment')
 }else if(action==='next_action'||action==='note'){
  if(!exact(['text'])||typeof payload.text!=='string'||payload.text.trim().length<1||payload.text.length>1000)throw Error('invalid_note')
 }else if(action==='stage_change'){
  if(!exact(['stage'])||!STAGES.has(payload.stage)||!TRANSITIONS[currentStage].includes(payload.stage))
    throw Error('invalid_stage_transition')
  // "active" remains forbidden until a separate backend validator verifies
  // Meta assets and operational test evidence; never activate via UI alone.
  if(payload.stage==='active')throw Error('operational_validation_required')
 }else throw Error('invalid_action')
 return Object.freeze({organizationId,protocolId,actorId,currentStage,expectedVersion,action,payload:Object.freeze({...payload})})
}
