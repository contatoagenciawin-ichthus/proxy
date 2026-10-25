// Server-only adapter around a dedicated, restricted PostgreSQL pool.
// This module intentionally has no default pool and never reads Meta credentials.
import {makeConnectionReceiptStore} from './connection-receipt-store.mjs'
export function createCentralReceiptRuntime({pool}={}){
 if(typeof pool?.connect!=='function')throw new TypeError('dedicated_receiver_pool_required')
 const beginTransaction=async work=>{
  const client=await pool.connect()
  try{
   const roles=await client.query("select current_setting('is_superuser') as superuser, rolbypassrls as bypass_rls from pg_roles where rolname=current_user")
   if(roles.rows.length!==1||roles.rows[0].superuser!=='off'||roles.rows[0].bypass_rls!==false)throw new Error('unsafe_receiver_database_role')
   // This login must be explicitly scoped, with no unrelated table privileges.
   const role=await client.query("select pg_has_role(current_user,'proxy_connection_receiver','member') as authorized")
   if(role.rows.length!==1||role.rows[0].authorized!==true)throw new Error('receiver_role_not_granted')
   await client.query('begin')
   try{
    const result=await work({query:(statement,params=[])=>client.query(statement,params)})
    await client.query('commit')
    return result
   }catch(e){await client.query('rollback');throw e}
  }finally{client.release()}
 }
 const receiptStore=makeConnectionReceiptStore({beginTransaction})
 return Object.freeze({
  ...receiptStore,
  // Only server-authorized admin code can call this with tenant IDs from the
  // explicit provider allowlist. The SQL login still runs behind FORCE RLS.
  async listReceipts(organizationId){
   if(typeof organizationId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(organizationId))throw new TypeError('invalid_organization_id')
   return beginTransaction(async tx=>{
    await tx.query("select set_config('app.organization_id',$1,true)",[organizationId])
    const {rows}=await tx.query(
     "select protocol_id::text as \"protocolId\",organization_id::text as \"organizationId\",product,channel,status,received_at as \"receivedAt\" from proxy_control.connection_requests where organization_id=$1 order by received_at desc,protocol_id desc limit 50",
     [organizationId]
    )
    return rows
   })
  }
 })
}
