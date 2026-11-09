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
