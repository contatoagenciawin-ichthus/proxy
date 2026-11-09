import {sealMetaCredential,validateCredentialIdentity} from './credential-envelope.mjs'
// This writer is intentionally not an HTTP endpoint. A caller must first
// complete OAuth code exchange and verify Meta app, scopes, WABA and phone
// server-side. Raw tokens must never enter request metadata, logs or CRMs.
const OPERATOR=/^[A-Za-z0-9_-]{3,128}$/
const REQUIRED=['whatsapp_business_management','whatsapp_business_messaging']

export function createCredentialWriter({pool,expectedAppId,rootKeyHex}={}){
 if(typeof pool?.connect!=='function')throw TypeError('credential_writer_pool_required')
 if(typeof expectedAppId!=='string'||!/^[0-9]{5,24}$/.test(expectedAppId))throw TypeError('app_id_required')
 return Object.freeze({
  async store({identity,accessToken,grantedScopes,operatorId,expiresAt=null}={}){
   const asset=validateCredentialIdentity(identity)
   if(asset.appId!==expectedAppId)throw Error('credential_app_mismatch')
   if(!OPERATOR.test(operatorId||''))throw Error('credential_operator_missing')
   if(!Array.isArray(grantedScopes)||REQUIRED.some(x=>!grantedScopes.includes(x)))throw Error('credential_scopes_insufficient')
   if(grantedScopes.some(x=>typeof x!=='string'||x.length>128)||grantedScopes.length>40)throw Error('credential_scopes_invalid')
   if(expiresAt!==null && (!Number.isFinite(Date.parse(expiresAt))||Date.parse(expiresAt)<=Date.now()))throw Error('credential_expired')
   // Seal before acquiring the database connection to avoid holding DB locks
   // during cryptographic work. Authentication context is embedded in AAD.
   const envelope=sealMetaCredential({identity:asset,accessToken,rootKeyHex})
   const db=await pool.connect()
   let began=false
   try{
    const role=await db.query("select current_user as name,rolsuper,rolbypassrls,rolcreaterole from pg_roles where rolname=current_user")
    const p=role.rows?.[0]
    if(role.rows?.length!==1||p.name!=='proxy_credential_writer_login'||p.rolsuper!==false||p.rolbypassrls!==false||p.rolcreaterole!==false)throw Error('credential_writer_unsafe_role')
    await db.query('begin')
    began=true
    await db.query("select set_config('app.organization_id',$1,true)",[asset.organizationId])
    const rows=await db.query(`select id,phase,operator_id,waba_id,phone_number_id,meta_app_id
       from proxy_control.whatsapp_provisioning where organization_id=$1
       and protocol_id=$2 and product='proxy-relationship' for update`,
       [asset.organizationId,asset.protocolId])
    const row=rows.rows?.[0]
    if(rows.rows?.length!==1||row.phase!=='authorization_received'||row.operator_id!==operatorId)
     throw Error('credential_writer_wrong_protocol_or_phase')
    const sess=await db.query(`select 1 from proxy_control.whatsapp_authorization_sessions
       where organization_id=$1 and provisioning_id=$2 and operator_id=$3
       and expected_waba_id=$4 and expected_phone_number_id=$5
       and expected_app_id=$6 and consumed_at is not null
       and consumed_at<=expires_at
       order by consumed_at desc limit 1`,
       [asset.organizationId,row.id,operatorId,asset.wabaId,asset.phoneNumberId,asset.appId])
    if(sess.rows?.length!==1)throw Error('credential_writer_no_matching_authorization')
    if((row.waba_id&&row.waba_id!==asset.wabaId)||(row.phone_number_id&&row.phone_number_id!==asset.phoneNumberId)||
       (row.meta_app_id&&row.meta_app_id!==asset.appId))throw Error('credential_writer_asset_conflict')
    const inserted=await db.query(`insert into proxy_control.whatsapp_credential_envelopes
       (provisioning_id,organization_id,envelope_version,key_version,iv,ciphertext,tag,fingerprint,authorized_scopes,expires_at)
       values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict(provisioning_id) do nothing returning provisioning_id`,
       [row.id,asset.organizationId,envelope.envelopeVersion,envelope.keyVersion,envelope.iv,envelope.ciphertext,
        envelope.tag,envelope.fingerprint,grantedScopes,expiresAt])
    if(inserted.rows?.length!==1)throw Error('credential_writer_already_persisted')
    const transitioned=await db.query(`update proxy_control.whatsapp_provisioning set phase='credential_secured',
       waba_id=$3,phone_number_id=$4,meta_app_id=$5,updated_at=now()
       where id=$1 and organization_id=$2 and phase='authorization_received' returning id`,
       [row.id,asset.organizationId,asset.wabaId,asset.phoneNumberId,asset.appId])
    if(transitioned.rows?.length!==1)throw Error('credential_writer_conflicting_transition')
    await db.query(`insert into proxy_control.whatsapp_provisioning_events
       (provisioning_id,organization_id,event_type,operator_id,details)
       values($1,$2,'credential_secured',$3,$4::jsonb)`,
       [row.id,asset.organizationId,operatorId,JSON.stringify({fingerprint:envelope.fingerprint,keyVersion:envelope.keyVersion})])
    await db.query('commit')
    began=false
    return {provisioningId:row.id,fingerprint:envelope.fingerprint,stored:true}
   }catch(e){if(began)await db.query('rollback').catch(()=>{});throw e}
   finally{db.release()}
  }
 })
}
