import 'server-only'
import pg from 'pg'
import {createConnectionAdminReadStore} from './connection-admin-read-store.mjs'
let pool=null,conn=null
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// This reader cannot insert receipts, update workflows, read Meta vaults,
// or receive connection requests. An admin session is checked by the caller.
export function getConnectionAdminReader(env=process.env){
 if(env.PROXY_REQUEST_ADMIN_READ_ENABLED!=='true')return null
 const raw=env.PROXY_REQUEST_ADMIN_READ_DATABASE_URL
 if(typeof raw!=='string'||!raw)throw Error('admin_reader_not_configured')
 const u=new URL(raw)
 if(!['postgres:','postgresql:'].includes(u.protocol)||!u.hostname||!u.password||
    u.username!=='proxy_connection_admin_reader_login')throw Error('admin_reader_not_configured')
 const allowed=String(env.PROXY_CONNECTION_REQUEST_ALLOWED_ORGS||'').split(',').map(x=>x.trim()).filter(Boolean)
 if(allowed.length<1||allowed.length>50||new Set(allowed).size!==allowed.length||allowed.some(x=>!UUID.test(x)))throw Error('admin_reader_allowlist_invalid')
 if(!pool||conn!==raw){
  pool=new pg.Pool({connectionString:raw,max:2,ssl:{rejectUnauthorized:true},
   connectionTimeoutMillis:4000,idleTimeoutMillis:10000})
  conn=raw
 }
 return createConnectionAdminReadStore({pool,allowedOrganizations:allowed})
}
