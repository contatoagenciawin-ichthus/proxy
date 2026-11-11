import {createHmac,timingSafeEqual} from "node:crypto";
const ORG="e9b935b6-3349-4b2c-970d-be8ad3bc243d";
const PROTOCOL="6419a70f-854d-4b7f-989a-25beaadabeed";
const WABA="107697061976892";
const PHONE="107612478652254";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const result=(status,code)=>Response.json({ok:false,status,error:code},
 {status:status==="rejected"?422:status==="uncertain"?502:403,
 headers:{"Cache-Control":"no-store"}});

export async function handleIchthusHumanOutbound(request,{env=process.env,send,now=Date.now()}={}){
 if(env.VERCEL_ENV!=="production"||env.PROXY_ICHTHUS_WHATSAPP_SEND_ENABLED!=="true")
  return Response.json({ok:false,status:"blocked",error:"send_disabled"},{status:503});
 const secret=env.ICHTHUS_WHATSAPP_FORWARD_SECRET;
 if(typeof secret!=="string"||secret.length<32||typeof send!=="function")
  return Response.json({ok:false,status:"blocked",error:"gateway_unavailable"},{status:503});
 if(request.method!=="POST"||request.headers.get("content-type")!=="application/json"||
    request.headers.has("cookie")||request.headers.has("origin")||
    request.headers.has("authorization"))return result("blocked","invalid_request");
 if(Number(request.headers.get("content-length")||0)>3500)return result("blocked","invalid_request");
 const timestamp=request.headers.get("x-proxy-outbound-timestamp");
 const signature=request.headers.get("x-proxy-outbound-signature");
 if(!/^[0-9]{13}$/.test(timestamp||"")||Math.abs(now-Number(timestamp))>120000||
    !/^sha256=[0-9a-f]{64}$/.test(signature||""))return result("blocked","unauthorized");
 let raw;
 try{
  const chunks=[];let length=0;
  for await(const piece of request.body||[]){
   const bytes=Buffer.from(piece);
   length+=bytes.length;
   if(length>3500)return result("blocked","invalid_request");
   chunks.push(bytes);
  }
  raw=Buffer.concat(chunks);
 }catch{return result("blocked","invalid_request")}
 if(!raw?.length)return result("blocked","invalid_request");
 const expected=createHmac("sha256",secret)
  .update("ichthus-outbound-v1\n"+timestamp+"\n").update(raw).digest();
 const actual=Buffer.from(signature.slice(7),"hex");
 if(actual.length!==expected.length||!timingSafeEqual(expected,actual))
  return result("blocked","unauthorized");
 let body;
 try{body=JSON.parse(raw.toString("utf8"))}catch{return result("blocked","invalid_request")}
 if(!body||Object.keys(body).sort().join(",")!=="body,recipient,requestId,v"||
    body.v!==1||typeof body.requestId!=="string"||!UUID.test(body.requestId)||
    typeof body.recipient!=="string"||!/^\d{7,15}$/.test(body.recipient)||
    typeof body.body!=="string"||!body.body.length||body.body.length>2000||
    body.body.trim()!==body.body)return result("blocked","invalid_request");
 let answer;
 try{answer=await send({organizationId:ORG,protocolId:PROTOCOL,wabaId:WABA,
  phoneNumberId:PHONE,recipient:body.recipient,body:body.body})}
 catch{return result("uncertain","provider_outcome_unknown")}
 if(answer?.status==="accepted"&&typeof answer.providerMessageId==="string")
  return Response.json({ok:true,status:"accepted",providerMessageId:answer.providerMessageId},
   {headers:{"Cache-Control":"no-store"}});
 if(answer?.status==="rejected")return result("rejected","provider_rejected");
 return result("uncertain","provider_outcome_unknown");
}
