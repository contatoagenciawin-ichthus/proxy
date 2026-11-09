// Pure, testable HTTP authorization gate. Platform admin identity is checked
// separately through currentPlatformAdmin() in each route.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
/** @param {Request} request @param {{origin?:string,maxBytes?:number}} [options] */
export function verifyProvisioningPost(request,{origin,maxBytes=7000}={}){
 if(typeof origin!=='string'||!origin.startsWith('https://'))return false
 let url
 try{url=new URL(request.url)}catch{return false}
 if(url.origin!==origin||request.method!=='POST')return false
 if(request.headers.get('origin')!==origin)return false
 const site=request.headers.get('sec-fetch-site')
 if(site&&site!=='same-origin')return false
 if(!/\bapplication\/json\b/i.test(request.headers.get('content-type')||''))return false
 const len=request.headers.get('content-length')
 if(len&&(!/^\d+$/.test(len)||Number(len)>maxBytes))return false
 return true
}
export function validateProvisioningBody(body){
 if(!body||typeof body!=='object'||Array.isArray(body))throw Error('provisioning_invalid_body')
 if(!UUID.test(body.organizationId||'')||!UUID.test(body.protocolId||''))
  throw Error('provisioning_invalid_identity')
 return {organizationId:body.organizationId,protocolId:body.protocolId}
}
