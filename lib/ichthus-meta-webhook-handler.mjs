import { normalizeCoexistenceEntries } from "./ichthus-coexistence-events.mjs";
import { createHmac,timingSafeEqual } from "node:crypto";
import { forwardIchthusVerifiedWhatsApp } from "./ichthus-whatsapp-forward-client.mjs";
// Staged dedicated Ichthus endpoint. Do not reuse the Eduardo Brasil webhook.
// Never install/change Meta webhook settings without separate authorization.
const fail=(status,error)=>Response.json({ok:false,error},{status,headers:{"Cache-Control":"no-store"}});
export async function handleIchthusMetaWebhook(request,{
 env=process.env,fetchImpl=fetch,now=Date.now(),
}={}){
 if(env.ICHTHUS_META_WHATSAPP_INGRESS_ENABLED!=="true")return fail(503,"ingress_disabled");
 const metaSecret=env.META_APP_SECRET,forwardSecret=env.ICHTHUS_WHATSAPP_FORWARD_SECRET;
 const endpoint=env.ICHTHUS_WHATSAPP_CRM_ENDPOINT;
 if(typeof metaSecret!=="string"||metaSecret.length<32||
    typeof forwardSecret!=="string"||forwardSecret.length<32||
    typeof endpoint!=="string")return fail(503,"ingress_unavailable");
 if(request.method!=="POST")return fail(405,"method_not_allowed");
 if(request.headers.get("content-type")!=="application/json")return fail(400,"invalid_content_type");
 if(request.headers.has("content-length")&&Number(request.headers.get("content-length"))>1024*1024)return fail(413,"payload_too_large");
 let rawBody;
 try{
  const reader=request.body?.getReader();
  if(!reader)return fail(400,"invalid_body");
  const parts=[];let total=0;
  for(;;){
   const {done,value}=await reader.read();
   if(done)break;
   total+=value.byteLength;
   if(total>1024*1024){await reader.cancel();return fail(413,"invalid_body_size")}
   parts.push(Buffer.from(value));
  }
  rawBody=Buffer.concat(parts,total);
 }catch{return fail(400,"invalid_body")}
 if(!rawBody.length)return fail(413,"invalid_body_size");
 const signature=request.headers.get("x-hub-signature-256");
 if(typeof signature!=="string"||!/^sha256=[a-f0-9]{64}$/.test(signature))return fail(401,"invalid_meta_signature");
 const expected=createHmac("sha256",metaSecret).update(rawBody).digest();
 const actual=Buffer.from(signature.slice(7),"hex");
 if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return fail(401,"invalid_meta_signature");
 let body;
 try{body=JSON.parse(rawBody.toString("utf8"))}catch{return fail(400,"invalid_payload")}
 if(body?.object!=="whatsapp_business_account"||!Array.isArray(body.entry))return fail(400,"invalid_payload");
 let events;
 try{
  events=normalizeCoexistenceEntries(body.entry);
 }catch{return fail(400,"invalid_events")}
 if(!events.length)return Response.json({ok:true,forwarded:0},{headers:{"Cache-Control":"no-store"}});
 try{
  const result=await forwardIchthusVerifiedWhatsApp({events,endpoint,secret:forwardSecret,fetchImpl,now,vercelProtectionBypass:env.ICHTHUS_CRM_VERCEL_BYPASS_SECRET||undefined});
  return Response.json({ok:true,forwarded:result.forwarded},{headers:{"Cache-Control":"no-store"}});
 }catch{return fail(503,"crm_delivery_unavailable")}
}
