import 'server-only'
import pg from 'pg'
import {createConnectionWorkflowStore} from './connection-workflow-store.mjs'
import {isPlatformAdmin,getAdminConfig} from './policy.mjs'
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
let cachedPool=null,cachedUri=null

// Only a dedicated operator login may touch these tables. The existing
// receiving service MUST NOT acquire workflow write privileges.
export function getConnectionWorkflowAdminRuntime(env=process.env){
 if(env.VERCEL_ENV!=='preview'||env.VERCEL_GIT_COMMIT_REF!=='feat/g2-admin-read-isolation-20261106'||
    env.PROXY_REQUEST_WORKFLOW_ENABLED!=='true'||env.PROXY_REQUEST_ADMIN_READ_ENABLED!=='true')return null
 const raw=env.PROXY_REQUEST_WORKFLOW_DATABASE_URL
 if(typeof raw!=='string'||!raw)return null
 const url=new URL(raw)
 if(!['postgres:','postgresql:'].includes(url.protocol)||!url.hostname||
    !url.password||url.username!=='proxy_connection_workflow_preview_login')throw Error('workflow_database_not_configured')
 const allowed=String(env.PROXY_CONNECTION_REQUEST_ALLOWED_ORGS||'').split(',').map(s=>s.trim()).filter(Boolean)
 if(allowed.length<1||allowed.length>50||new Set(allowed).size!==allowed.length||
    allowed.some(id=>!UUID.test(id)))throw Error('workflow_org_allowlist_invalid')
 if(!cachedPool||cachedUri!==raw){
  cachedPool=new pg.Pool({connectionString:raw,ssl:{rejectUnauthorized:true},max:2,
    connectionTimeoutMillis:4000,idleTimeoutMillis:10000})
  cachedUri=raw
 }
 const beginTransaction=async work=>{
  const client=await cachedPool.connect()
  try{
   const roles=await client.query(`select current_user as name,
     current_setting('is_superuser') as superuser,rolbypassrls as bypass_rls,
     rolcreaterole as create_role from pg_roles where rolname=current_user`)
   const role=roles.rows[0]
   if(roles.rows.length!==1||role.name!=='proxy_connection_workflow_preview_login'||
      role.superuser!=='off'||role.bypass_rls!==false||role.create_role!==false)
     throw Error('unsafe_workflow_database_role')
   const membership=await client.query(`select
     pg_has_role(current_user,'proxy_connection_workflow_operator','member') as operator,
     pg_has_role(current_user,'proxy_connection_receiver_restricted','member') as receiver`)
   if(membership.rows.length!==1||membership.rows[0].operator!==true||
      membership.rows[0].receiver!==false)throw Error('unsafe_workflow_database_membership')
   await client.query('begin')
   try{
    const result=await work({query:(sql,args=[])=>client.query(sql,args)})
    await client.query('commit')
    return result
   }catch(e){await client.query('rollback');throw e}
  }finally{client.release()}
 }
 const authorizeOperator=async({actorId,organizationId,protocolId})=>
   isPlatformAdmin(actorId,getAdminConfig(env))&&UUID.test(organizationId||'')&&
   UUID.test(protocolId||'')&&allowed.includes(organizationId)
 const base=createConnectionWorkflowStore({beginTransaction,authorizeOperator})
 return Object.freeze({
  read:base.read,
  apply:async args=>{
   // Assignment is restricted to configured platform operators.
   // A syntactically valid GitHub ID is not sufficient authorization.
   if(args?.action==='assign' &&
      !isPlatformAdmin(args?.payload?.operatorId,getAdminConfig(env)))
     throw Error('invalid_assignment')
   return base.apply(args)
  }
 })
}
