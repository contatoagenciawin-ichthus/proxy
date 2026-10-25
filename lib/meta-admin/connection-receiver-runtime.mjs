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
 return makeConnectionReceiptStore({beginTransaction})
}
