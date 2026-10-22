import { signIchthusInboundForward } from "../../../../../../lib/ichthus-whatsapp-forward-contract.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
// Explicit preview-only opt-in, no Meta webhook or database writes.
// Vercel Deployment Protection still guards this URL.
export async function GET(){
 if(process.env.VERCEL_ENV!=="preview"||
    process.env.ICHTHUS_WHATSAPP_PREVIEW_PROBE_ENABLED!=="true")
   return Response.json({ok:false,error:"probe_disabled"},{status:503});
 const endpoint=process.env.ICHTHUS_WHATSAPP_CRM_ENDPOINT;
 const secret=process.env.ICHTHUS_WHATSAPP_FORWARD_SECRET;
 const bypass=process.env.ICHTHUS_CRM_VERCEL_BYPASS_SECRET;
 let url;
 try{url=new URL(endpoint)}catch{return Response.json({ok:false,error:"configuration_missing"},{status:503})}
 if(url.protocol!=="https:"||!url.hostname.endsWith(".vercel.app")||
    url.pathname!=="/api/relationship/whatsapp/inbound"||
    url.search||url.hash||typeof bypass!=="string"||!/^[a-zA-Z0-9]{32}$/.test(bypass))
   return Response.json({ok:false,error:"configuration_invalid"},{status:503});
 const probeUrl=new URL(url.toString());
 probeUrl.pathname="/api/relationship/whatsapp/probe";
 const rawBody=Buffer.from(JSON.stringify({version:1,events:[{
  phoneNumberId:"107612478652254",
  providerMessageId:"wamid.proxy_preview_probe",sender:"5511999999999",
  kind:"text",body:"PROBE_NO_PERSIST",providerTimestamp:null,
 }]}));
 const timestamp=String(Date.now());
 let signature;
 try{signature=signIchthusInboundForward({rawBody,timestamp,secret})}
 catch{return Response.json({ok:false,error:"signing_unavailable"},{status:503})}
 try{
  const response=await fetch(probeUrl,{
   method:"POST",cache:"no-store",redirect:"error",signal:AbortSignal.timeout(10000),
   headers:{"content-type":"application/json","x-proxy-inbound-timestamp":timestamp,
    "x-proxy-inbound-signature":signature,"x-vercel-protection-bypass":bypass},
   body:rawBody,
  });
  if(!response.ok)return Response.json({ok:false,phase:"crm_rejected",status:response.status},{status:502});
  const result=await response.json();
  if(result?.signatureValid!==true||result?.tenantBound!==true||result?.persisted!==false)
   return Response.json({ok:false,phase:"unexpected_response"},{status:502});
  return Response.json({ok:true,forwardSignatureValid:true,tenantBound:true,persisted:false},
   {headers:{"Cache-Control":"no-store"}});
 }catch{return Response.json({ok:false,phase:"crm_unreachable"},{status:502})}
}
