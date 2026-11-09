import 'server-only'
import pg from 'pg'
import {createProvisioningStore} from './provisioning-store.mjs'
import {createCredentialWriter} from './credential-writer.mjs'

// These are platform-scoped secrets. None is indexed by tenant and none should
// be exposed to the browser or downstream CRM.
const config={
 provisioning:{variable:'PROXY_PROVISIONING_DATABASE_URL',role:'proxy_provisioning_runtime_login'},
 writer:{variable:'PROXY_CREDENTIAL_WRITER_DATABASE_URL',role:'proxy_credential_writer_login'}
}
const pools=new Map()
function getPool(type,env=process.env){
 if(!config[type])throw Error('provisioning_invalid_role')
 const {variable,role}=config[type]
 const raw=env[variable]
 if(typeof raw!=='string'||!raw)throw Error('provisioning_runtime_not_configured')
 let url
 try{url=new URL(raw)}catch{throw Error('provisioning_runtime_not_configured')}
 if(!['postgres:','postgresql:'].includes(url.protocol)||!url.hostname||
    url.username!==role||!url.password||!url.pathname.startsWith('/'))
   throw Error('provisioning_runtime_not_configured')
 if(!pools.has(type)||pools.get(type).raw!==raw){
  const old=pools.get(type)
  if(old?.pool)void old.pool.end().catch(()=>{})
  pools.set(type,{raw,pool:new pg.Pool({connectionString:raw,max:2,ssl:{rejectUnauthorized:true},
   connectionTimeoutMillis:3500,idleTimeoutMillis:10000})})
 }
 return pools.get(type).pool
}
export function provisioningEnabled(env=process.env){
 return env.PROXY_PROVISIONING_ENABLED==='true'
}
export function getProvisioningStore(env=process.env){
 if(!provisioningEnabled(env))throw Error('provisioning_disabled')
 return createProvisioningStore({pool:getPool('provisioning',env)})
}
export function getCredentialWriter(env=process.env){
 if(!provisioningEnabled(env))throw Error('provisioning_disabled')
 const appId=env.META_APP_ID||env.NEXT_PUBLIC_META_APP_ID||'1952034255371331'
 return createCredentialWriter({pool:getPool('writer',env),
  expectedAppId:appId,rootKeyHex:env.PROXY_META_CREDENTIAL_ROOT_KEY_V1})
}

export async function verifyProvisioningInfrastructure(env=process.env){
 if(!provisioningEnabled(env))throw Error('provisioning_disabled')
 if(typeof env.META_APP_SECRET!=='string'||env.META_APP_SECRET.length<16||
    typeof env.PROXY_META_CREDENTIAL_ROOT_KEY_V1!=='string'||
    !/^[a-f0-9]{64}$/i.test(env.PROXY_META_CREDENTIAL_ROOT_KEY_V1))
   throw Error('provisioning_platform_secrets_missing')
 if(typeof env.PROXY_META_COEXISTENCE_CONFIG_ID!=='string'||
    !/^[0-9]{5,24}$/.test(env.PROXY_META_COEXISTENCE_CONFIG_ID))
   throw Error('provisioning_meta_config_missing')
 // Validate the actual writer role before issuing an OAuth code. An otherwise
 // successful Meta consent must not be wasted on absent DB/GRANT settings.
 const client=await getPool('writer',env).connect()
 try{
  const role=await client.query(`select current_user as name,rolsuper,rolbypassrls,rolcreaterole
   from pg_roles where rolname=current_user`)
  const p=role.rows?.[0]
  if(role.rows?.length!==1||p.name!=='proxy_credential_writer_login'||
    p.rolsuper!==false||p.rolbypassrls!==false||p.rolcreaterole!==false)
   throw Error('provisioning_writer_not_ready')
  const grants=await client.query(`select
    has_table_privilege(current_user,'proxy_control.whatsapp_credential_envelopes','INSERT') as can_insert,
    has_table_privilege(current_user,'proxy_control.whatsapp_credential_envelopes','SELECT') as can_read,
    has_table_privilege(current_user,'proxy_control.whatsapp_credential_envelopes','UPDATE') as can_update,
    has_table_privilege(current_user,'proxy_control.whatsapp_credential_envelopes','DELETE') as can_delete`)
  const v=grants.rows?.[0]
  if(grants.rows?.length!==1||v.can_insert!==true||v.can_read!==false||
     v.can_update!==false||v.can_delete!==false)throw Error('provisioning_writer_not_ready')
  return true
 }finally{client.release()}
}
