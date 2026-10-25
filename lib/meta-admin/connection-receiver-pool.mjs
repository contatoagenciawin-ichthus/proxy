import 'server-only'
import pg from 'pg'
import {createCentralReceiptRuntime} from './connection-receiver-runtime.mjs'

let cachedPool=null
let cachedConnectionString=null

// Separate least-privileged database login. Never reuse a Meta vault, CRM,
// Vercel deployment admin or tenant's Better Auth credential here.
export function getCentralReceiptStore(env=process.env){
 if(env.PROXY_CONNECTION_REQUEST_RECEIVER_ENABLED!=='true')return null
 const raw=env.PROXY_CONNECTION_REQUEST_DATABASE_URL
 if(typeof raw!=='string'||!raw)return null
 const url=new URL(raw)
 if(!['postgresql:','postgres:'].includes(url.protocol)||!url.hostname||!url.username||!url.password)throw new Error('receiver_database_not_configured')
 if(!cachedPool||cachedConnectionString!==raw){
  // Node performs CA and hostname verification. Do not permit TLS opt-outs.
  cachedPool=new pg.Pool({
   connectionString:raw,max:3,connectionTimeoutMillis:4000,
   idleTimeoutMillis:10000,ssl:{rejectUnauthorized:true}
  })
  cachedConnectionString=raw
 }
 return createCentralReceiptRuntime({pool:cachedPool})
}
