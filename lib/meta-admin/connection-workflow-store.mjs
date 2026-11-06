// Transactional provider workflow ledger. Dependency injection only: this file
// cannot create an unrestricted DB pool or authenticate an administrator.
// Caller MUST supply a trusted authenticated platform operator, tenant allowlist
// authorization and a dedicated FORCE-RLS transaction (NOT the receipt login).
import {validateWorkflowMutation} from './connection-workflow-policy.mjs'

export function createConnectionWorkflowStore({beginTransaction,authorizeOperator}={}){
 if(typeof beginTransaction!=='function'||typeof authorizeOperator!=='function')
  throw new TypeError('workflow_dependencies_required')
 return Object.freeze({
  async apply({actorId,organizationId,protocolId,expectedVersion,action,payload}={}){
   // Only server-resolved authenticated administrator ID can enter this method.
   // Do not pass a browser-supplied actor ID.
   if(typeof actorId!=='string'||!/^\d{1,32}$/.test(actorId))
    throw Error('invalid_operator')
   const authorized=await authorizeOperator({actorId,organizationId,protocolId})
   if(authorized!==true)throw Error('workflow_operator_denied')
   return beginTransaction(async tx=>{
    await tx.query("select set_config('app.organization_id',$1,true)",[organizationId])
    // This INSERT ... SELECT requires a real receipt in the same organization;
    // no workflow can be created for an invented or cross-tenant protocol.
    await tx.query(`
      insert into proxy_control.connection_request_workflow
       (product,organization_id,protocol_id)
      select product,organization_id,protocol_id
      from proxy_control.connection_requests
      where product='proxy-relationship' and organization_id=$1 and protocol_id=$2
      on conflict (product,organization_id,protocol_id) do nothing
    `,[organizationId,protocolId])
    const selected=await tx.query(`
      select stage,assigned_operator_id as "assignedOperatorId",
             next_action as "nextAction",version
      from proxy_control.connection_request_workflow
      where product='proxy-relationship' and organization_id=$1 and protocol_id=$2
      for update
    `,[organizationId,protocolId])
    if(selected.rows.length!==1)throw Error('workflow_receipt_not_found')
    const old=selected.rows[0]
    const item=validateWorkflowMutation({organizationId,protocolId,
      actorId,currentStage:old.stage,expectedVersion,action,payload})
    if(old.version!==item.expectedVersion)throw Error('workflow_version_conflict')
    const newStage=action==='stage_change'?item.payload.stage:old.stage
    const operatorId=action==='assign'?item.payload.operatorId:old.assignedOperatorId
    const nextAction=action==='next_action'?item.payload.text.trim():old.nextAction
    const updated=await tx.query(`
      update proxy_control.connection_request_workflow
      set stage=$3,assigned_operator_id=$4,next_action=$5,
          version=version+1,updated_at=now()
      where product='proxy-relationship' and organization_id=$1
        and protocol_id=$2 and version=$6
      returning stage,assigned_operator_id as "assignedOperatorId",
                next_action as "nextAction",updated_at as "updatedAt",version
    `,[organizationId,protocolId,newStage,operatorId,nextAction,expectedVersion])
    if(updated.rows.length!==1)throw Error('workflow_version_conflict')
    await tx.query(`
      insert into proxy_control.connection_request_workflow_events
       (product,organization_id,protocol_id,actor_id,action,from_stage,to_stage,note)
      values('proxy-relationship',$1,$2,$3,$4,$5,$6,$7)
    `,[organizationId,protocolId,actorId,action,old.stage,newStage,
      action==='note'?item.payload.text.trim():null])
    // Both update and event must COMMIT together before a successful response.
    return {...updated.rows[0],organizationId,protocolId}
   })
  },
  async read({actorId,organizationId,protocolId}={}){
   if(typeof actorId!=='string'||!/^\d{1,32}$/.test(actorId))throw Error('invalid_operator')
   if(await authorizeOperator({actorId,organizationId,protocolId})!==true)
    throw Error('workflow_operator_denied')
   return beginTransaction(async tx=>{
    await tx.query("select set_config('app.organization_id',$1,true)",[organizationId])
    const row=await tx.query(`
      select stage,assigned_operator_id as "assignedOperatorId",
             next_action as "nextAction",version,updated_at as "updatedAt"
      from proxy_control.connection_request_workflow
      where product='proxy-relationship' and organization_id=$1 and protocol_id=$2
    `,[organizationId,protocolId])
    const events=await tx.query(`
      select actor_id as "actorId",action,from_stage as "fromStage",
             to_stage as "toStage",note,recorded_at as "recordedAt"
      from proxy_control.connection_request_workflow_events
      where product='proxy-relationship' and organization_id=$1 and protocol_id=$2
      order by recorded_at desc,id desc limit 100
    `,[organizationId,protocolId])
    return {workflow:row.rows[0]||null,events:events.rows}
   })
  }
 })
}
