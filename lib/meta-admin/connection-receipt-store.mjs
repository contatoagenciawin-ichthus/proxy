// Injection-only SQL receipt adapter. Caller must supply an authenticated,
// least-privilege central database transaction; never use the Meta vault pool.
export function makeConnectionReceiptStore({beginTransaction}){
 if(typeof beginTransaction!=='function')throw new TypeError('transaction_required')
 return Object.freeze({async saveReceipt(input){
  if(!input||typeof input!=='object')throw new TypeError('invalid_receipt_input')
  return beginTransaction(async tx=>{
   if(typeof tx?.query!=='function')throw new TypeError('transaction_query_required')
   const {rows:inserted}=await tx.query(
    `insert into proxy_control.connection_requests(product,organization_id,protocol_id,channel,status,version)
     values($1,$2,$3,$4,'received_by_proxy',$5)
     on conflict(product,organization_id,protocol_id) do nothing
     returning product,organization_id::text as "organizationId",protocol_id::text as "protocolId",channel,version`,
    [input.product,input.organizationId,input.protocolId,input.channel,input.version]
   )
   let row=inserted[0]
   if(!row){
    const existing=await tx.query(
     `select product,organization_id::text as "organizationId",protocol_id::text as "protocolId",channel,version
      from proxy_control.connection_requests where product=$1 and organization_id=$2 and protocol_id=$3`,
     [input.product,input.organizationId,input.protocolId]
    )
    row=existing.rows[0]
   }
   if(!row||row.channel!==input.channel||row.version!==input.version)throw new Error('receipt_conflict')
   return {product:row.product,organizationId:row.organizationId,protocolId:row.protocolId}
  })
 }})
}
