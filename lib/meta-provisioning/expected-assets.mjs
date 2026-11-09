import {findConnection} from '../meta-admin/inventory.mjs'
// Transitional evidence bridge for the first live tenant only.
// Future expected assets come from tenant-scoped database records, not code.
// These historical identifiers are VALIDATION constraints, never proof of
// current Meta permission or operational readiness.
const KNOWN=new Map([
 ['e9b935b6-3349-4b2c-970d-be8ad3bc243d','ichthus']
])
export function expectedAssetsForReceipt(organizationId){
 const inventoryId=KNOWN.get(organizationId)
 const item=inventoryId?findConnection(inventoryId):null
 return {expectedWabaId:item?.wabaId||null,expectedPhoneNumberId:item?.phoneNumberId||null}
}
