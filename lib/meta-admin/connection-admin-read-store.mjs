// Independent, read-only receipt projection for platform administrators.
// Never reuse the receiver's INSERT-capable credentials for admin lists.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export function createConnectionAdminReadStore({pool,allowedOrganizations=[]}={}){
 if(typeof pool?.connect!=='function')throw TypeError('admin_reader_pool_required')
 if(!Array.isArray(allowedOrganizations)||!allowedOrganizations.length||
  allowedOrganizations.length>50||new Set(allowedOrganizations).size!==allowedOrganizations.length||
  allowedOrganizations.some(x=>!UUID.test(x)))throw TypeError('admin_reader_allowlist_invalid')
 const allowed=new Set(allowedOrganizations)
 return Object.freeze({
  async listReceipts(organizationId){
   if(!UUID.test(organizationId||'')||!allowed.has(organizationId))throw Error('admin_reader_org_denied')
   const client=await pool.connect()
   try{
    const roles=await client.query(`select current_user as name,
      current_setting('is_superuser') as superuser,
      rolbypassrls as bypass_rls,rolcreaterole as create_role
      from pg_roles where rolname=current_user`)
    if(roles.rows.length!==1||roles.rows[0].name!=='proxy_connection_admin_reader_login'||
      roles.rows[0].superuser!=='off'||roles.rows[0].bypass_rls!==false||
      roles.rows[0].create_role!==false)throw Error('unsafe_admin_reader_role')
    const privileges=await client.query(`select
      has_table_privilege(current_user,'proxy_control.connection_requests','SELECT') as read_receipts,
      has_table_privilege(current_user,'proxy_control.connection_requests','INSERT') as insert_receipts,
      pg_has_role(current_user,'proxy_connection_receiver_restricted','member') as is_receiver,
      false as is_operator`)
    const p=privileges.rows[0]
    if(privileges.rows.length!==1||p.read_receipts!==true||p.insert_receipts!==false||
       p.is_receiver!==false||p.is_operator!==false)
      throw Error('unsafe_admin_reader_privileges')
    await client.query('begin read only')
    try{
     await client.query("select set_config('app.organization_id',$1,true)",[organizationId])
     const res=await client.query(`select protocol_id::text as "protocolId",
       organization_id::text as "organizationId",product,channel,status,
       received_at as "receivedAt"
       from proxy_control.connection_requests
       where product='proxy-relationship' and organization_id=$1
       order by received_at desc,protocol_id desc limit 50`,[organizationId])
     await client.query('commit')
     return res.rows
    }catch(e){await client.query('rollback');throw e}
   }finally{client.release()}
  }
 })
}
