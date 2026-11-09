// Transactional, tenant-scoped provisioning store. Requires a dedicated
// non-owner DB login with a separate restricted grants policy.
// No OAuth tokens are accepted or returned by this component.
import {randomBytes,createHash} from 'node:crypto'
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const OPERATOR=/^[A-Za-z0-9_-]{3,128}$/
const TOKEN=/^[A-Za-z0-9_-]{32,128}$/
const META_ID=/^[0-9]{5,24}$/
const APP_ID='1952034255371331'
const BAD_ROLE='provisioning_unsafe_runtime_role'
const badInput=()=>new Error('provisioning_invalid_input')

export function createProvisioningStore({pool,runtimeRole='proxy_provisioning_runtime_login'}={}){
 if(typeof pool?.connect!=='function')throw TypeError('provisioning_pool_required')
 if(runtimeRole!=='proxy_provisioning_runtime_login')throw Error(BAD_ROLE)
 async function scoped(org,work){
  if(!UUID.test(org||''))throw badInput()
  const db=await pool.connect()
  let transaction=false
  try{
   const role=await db.query("select current_user as name, rolcanlogin,rolsuper,rolbypassrls,rolcreaterole from pg_roles where rolname=current_user")
   const p=role.rows?.[0]
   if(role.rows.length!==1||p.name!==runtimeRole||p.rolcanlogin!==true||p.rolsuper!==false||p.rolbypassrls!==false||p.rolcreaterole!==false)throw Error(BAD_ROLE)
   const privileges=await db.query(`select
      has_table_privilege(current_user,'proxy_control.connection_requests','SELECT') as receipt_read,
      has_table_privilege(current_user,'proxy_control.connection_requests','UPDATE') as receipt_write,
      has_table_privilege(current_user,'proxy_control.whatsapp_credential_envelopes','SELECT') as vault_read,
      has_table_privilege(current_user,'proxy_control.whatsapp_credential_envelopes','INSERT') as vault_write`)
   const authz=privileges.rows?.[0]
   if(privileges.rows?.length!==1||authz.receipt_read!==true||
      authz.receipt_write!==false||authz.vault_read!==false||authz.vault_write!==false)
      throw Error('provisioning_runtime_unsafe_privileges')
   await db.query('begin')
   transaction=true
   await db.query("select set_config('app.organization_id',$1,true)",[org])
   const data=await work(db)
   await db.query('commit')
   transaction=false
   return data
  }catch(e){if(transaction)await db.query('rollback').catch(()=>{});throw e}
  finally{db.release()}
 }
 return Object.freeze({
  async beginFromReceipt({organizationId,protocolId,product='proxy-relationship',operatorId}){
   if(!UUID.test(protocolId||'')||!OPERATOR.test(operatorId||'')||product!=='proxy-relationship')throw badInput()
   return scoped(organizationId,async db=>{
    const exists=await db.query(`select id,channel,status from proxy_control.connection_requests
      where organization_id=$1 and protocol_id=$2 and product=$3`,[organizationId,protocolId,product])
    if(exists.rows?.length!==1||exists.rows[0].channel!=='whatsapp'||exists.rows[0].status!=='received_by_proxy')throw Error('provisioning_receipt_not_eligible')
    const req=exists.rows[0]
    const inserted=await db.query(`insert into proxy_control.whatsapp_provisioning
      (request_id,organization_id,protocol_id,product,phase,operator_id)
      values ($1,$2,$3,$4,'operator_assigned',$5)
      on conflict (request_id) do nothing returning id,phase,operator_id`,
     [req.id,organizationId,protocolId,product,operatorId])
    const row=inserted.rows?.[0]
    if(row){
     await db.query(`insert into proxy_control.whatsapp_provisioning_events
       (provisioning_id,organization_id,event_type,operator_id)
       values($1,$2,'operator_assigned',$3)`,[row.id,organizationId,operatorId])
     return {id:row.id,phase:row.phase,created:true}
    }
    const current=await db.query(`select id,phase,operator_id from proxy_control.whatsapp_provisioning
      where request_id=$1 and organization_id=$2 and protocol_id=$3 and product=$4`,
      [req.id,organizationId,protocolId,product])
    if(current.rows?.length!==1||current.rows[0].operator_id!==operatorId)throw Error('provisioning_identity_conflict')
    return {id:current.rows[0].id,phase:current.rows[0].phase,created:false}
   })
  },
  async issueAuthorization({organizationId,protocolId,operatorId,expectedWabaId=null,expectedPhoneNumberId=null}){
   if(!UUID.test(protocolId||'')||!OPERATOR.test(operatorId||'')||
      ![expectedWabaId,expectedPhoneNumberId].every(x=>x===null||x===undefined||(typeof x==='string'&&META_ID.test(x))))throw badInput()
   return scoped(organizationId,async db=>{
    const res=await db.query(`select id,phase,operator_id from proxy_control.whatsapp_provisioning
      where organization_id=$1 and protocol_id=$2 and product='proxy-relationship' for update`,
      [organizationId,protocolId])
    const row=res.rows?.[0]
    if(res.rows?.length!==1||!['operator_assigned','awaiting_authorization'].includes(row.phase)||row.operator_id!==operatorId)
     throw Error('provisioning_wrong_phase_or_operator')
    // Do not overwrite another active permit. One active session per protocol.
    const active=await db.query(`select id from proxy_control.whatsapp_authorization_sessions
      where provisioning_id=$1 and consumed_at is null and expires_at>now() for update`,[row.id])
    if(active.rows?.length)throw Error('provisioning_authorization_already_pending')
    const nonce=randomBytes(32).toString('base64url')
    const nonceDigest=createHash('sha256').update(nonce).digest('hex')
    const saved=await db.query(`insert into proxy_control.whatsapp_authorization_sessions
      (provisioning_id,organization_id,operator_id,nonce_digest,expected_waba_id,expected_phone_number_id,expected_app_id,expires_at)
      values($1,$2,$3,$4,$5,$6,$7,now()+interval '10 minutes')
      returning id,expires_at`,[row.id,organizationId,operatorId,nonceDigest,expectedWabaId,expectedPhoneNumberId,APP_ID])
    if(row.phase==='operator_assigned')
     await db.query(`update proxy_control.whatsapp_provisioning set phase='awaiting_authorization',updated_at=now()
      where id=$1 and organization_id=$2`,[row.id,organizationId])
    await db.query(`insert into proxy_control.whatsapp_provisioning_events
      (provisioning_id,organization_id,event_type,operator_id,details)
      values($1,$2,'authorization_session_issued',$3,$4::jsonb)`,
      [row.id,organizationId,operatorId,JSON.stringify({expiresAt:saved.rows[0].expires_at})])
    // Nonce delivered once to server-rendered handoff UI; never persisted as plaintext.
    return {sessionId:saved.rows[0].id,nonce,expiresAt:saved.rows[0].expires_at}
   })
  },
  async consumeAuthorization({organizationId,sessionId,nonce,operatorId,wabaId,phoneNumberId}){
   if(!UUID.test(sessionId||'')||!OPERATOR.test(operatorId||'')||!TOKEN.test(nonce||'')||
    ![wabaId,phoneNumberId].every(x=>typeof x==='string'&&META_ID.test(x)))throw badInput()
   const digest=createHash('sha256').update(nonce).digest('hex')
   return scoped(organizationId,async db=>{
    const res=await db.query(`update proxy_control.whatsapp_authorization_sessions s
       set consumed_at=now() from proxy_control.whatsapp_provisioning p
       where s.id=$1 and s.organization_id=$2 and s.operator_id=$3 and s.nonce_digest=$4
       and (s.expected_waba_id is null or s.expected_waba_id=$5)
       and (s.expected_phone_number_id is null or s.expected_phone_number_id=$6)
       and s.expected_app_id=$7
       and s.expires_at>now() and s.consumed_at is null and p.id=s.provisioning_id
       and p.organization_id=s.organization_id and p.phase='awaiting_authorization'
       returning s.provisioning_id`,[sessionId,organizationId,operatorId,digest,wabaId,phoneNumberId,APP_ID])
    if(res.rows?.length!==1)throw Error('provisioning_authorization_invalid_or_consumed')
    const provisioningId=res.rows[0].provisioning_id
    await db.query(`update proxy_control.whatsapp_provisioning
      set phase='authorization_received',meta_consent_at=now(),updated_at=now()
      where id=$1 and organization_id=$2 and phase='awaiting_authorization'`,[provisioningId,organizationId])
    await db.query(`insert into proxy_control.whatsapp_provisioning_events
      (provisioning_id,organization_id,event_type,operator_id)
      values($1,$2,'authorization_session_consumed',$3)`,
      [provisioningId,organizationId,operatorId])
    return {provisioningId}
   })
  }
 })
}
