import {createHmac} from "node:crypto";
const URL="https://crm.ichthusmkt.com.br/api/relationship/whatsapp/telemetry";
const ORG="e9b935b6-3349-4b2c-970d-be8ad3bc243d";
const PHONE="107612478652254";
const DATE_FIELDS=["observedAt","lastInboundAt","lastCrmOutboundAt","lastBusinessAppEchoAt","lastDeliveredAt","lastReadAt","lastFailedAt"];
const MAX_AGE=120000;
const validDate=value=>value===null||(typeof value==="string"&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString()===value);

export function validateIchthusTelemetry(value,now=Date.now()){
 const d=value?.data;
 if(!value||value.ok!==true||!d||d.version!==1||
  d.source!=="ichthus-crm-provider-events"||
  d.organizationId!==ORG||d.phoneNumberId!==PHONE||
  DATE_FIELDS.some(field=>!validDate(d[field]))||
  typeof d.observedAt!=="string"||Math.abs(now-Date.parse(d.observedAt))>MAX_AGE||
  !["deliveryFailures24h","inboundEvents24h"].every(key=>Number.isSafeInteger(d[key])&&d[key]>=0&&d[key]<=1000000)||
  Object.keys(d).some(key=>!["version","source","observedAt","organizationId","phoneNumberId",
   ...DATE_FIELDS,"deliveryFailures24h","inboundEvents24h"].includes(key)))
   return null;
 // Never relay the upstream response verbatim; keep only strictly allowed metadata.
 return Object.fromEntries([...DATE_FIELDS,"deliveryFailures24h","inboundEvents24h"].map(k=>[k,d[k]]));
}
export async function readIchthusOperationalTelemetry(env=process.env,fetcher=fetch,now=Date.now()){
 if(env.VERCEL_ENV!=="production"||env.PROXY_REQUEST_ADMIN_READ_ENABLED!=="true")
  return {state:"disabled",snapshot:null};
 const secret=env.ICHTHUS_WHATSAPP_FORWARD_SECRET;
 if(typeof secret!=="string"||secret.length<32)return {state:"unconfigured",snapshot:null};
 const timestamp=String(now);
 const sig=createHmac("sha256",secret).update("ichthus-telemetry-v1\n"+timestamp).digest("hex");
 try{
  const response=await fetcher(URL,{method:"GET",cache:"no-store",redirect:"error",
   headers:{accept:"application/json","x-proxy-telemetry-timestamp":timestamp,
    "x-proxy-telemetry-signature":"sha256="+sig},
   signal:AbortSignal.timeout(6500)});
  if(!response.ok)return {state:"unavailable",snapshot:null};
  if(!response.headers.get("content-type")?.includes("application/json"))
   return {state:"invalid",snapshot:null};
  if(Number(response.headers.get("content-length")||0)>4096)return {state:"invalid",snapshot:null};
  const raw=await response.text();
  if(Buffer.byteLength(raw)>4096)return {state:"invalid",snapshot:null};
  const snapshot=validateIchthusTelemetry(JSON.parse(raw),now);
  return snapshot?{state:"available",snapshot}:{state:"invalid",snapshot:null};
 }catch{return {state:"unavailable",snapshot:null};}
}
