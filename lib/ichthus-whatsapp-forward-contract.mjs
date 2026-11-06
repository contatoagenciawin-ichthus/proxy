import { createHmac, timingSafeEqual } from "node:crypto";

// Dedicated HMAC for Proxy→CRM WhatsApp events; NOT Meta App Secret.
// HTTP receiver and central sender must configure separate server-only key.
// Signature covers exact bytes and timestamp, and replay is deduped in DB.
const prefix="proxy-ichthus-whatsapp-events:v1:";
export function signIchthusInboundForward({rawBody,timestamp,secret}){
 if(!Buffer.isBuffer(rawBody)||!rawBody.length||rawBody.length>65536||
    typeof timestamp!=="string"||!/^\d{13}$/.test(timestamp)||
    typeof secret!=="string"||secret.length<32)throw Error("inbound_forward_invalid");
 return "sha256="+createHmac("sha256",secret).update(prefix).update(timestamp).update(":").update(rawBody).digest("hex");
}
export function verifyIchthusInboundForward({rawBody,timestamp,signature,secret,now=Date.now()}){
 if(!Number.isSafeInteger(now)||typeof timestamp!=="string"||
    !/^\d{13}$/.test(timestamp)||Math.abs(now-Number(timestamp))>60000||
    typeof signature!=="string"||!/^sha256=[a-f0-9]{64}$/.test(signature))return false;
 let expected;
 try{expected=signIchthusInboundForward({rawBody,timestamp,secret})}catch{return false}
 const a=Buffer.from(signature.slice(7),"hex"),b=Buffer.from(expected.slice(7),"hex");
 return a.length===b.length&&timingSafeEqual(a,b);
}
export function parseIchthusInboundForward(rawBody, organizationId="1715a7b9-5209-4e7c-8439-84658061904f"){
 if(!Buffer.isBuffer(rawBody)||rawBody.length>65536||!rawBody.length)throw Error("inbound_forward_invalid");
 let payload;
 try{payload=JSON.parse(rawBody.toString("utf8"))}catch{throw Error("inbound_forward_invalid")}
 if(!payload||Array.isArray(payload)||![1,2].includes(payload.version)||
    !Array.isArray(payload.events)||payload.events.length>50||!payload.events.length||
    Object.keys(payload).sort().join(",")!=="events,version")throw Error("inbound_forward_invalid");
 return payload.events.map(e=>{
  const extended = payload.version === 2 && Object.hasOwn(e ?? {}, "eventType");
  const keys = extended ? "body,eventType,kind,phoneNumberId,providerMessageId,providerTimestamp,sender" : "body,kind,phoneNumberId,providerMessageId,providerTimestamp,sender";
  const delivery = extended && ["sent","delivered","read","failed"].includes(e.eventType);
  if (extended && !delivery && e.eventType !== "echo") throw Error("inbound_forward_invalid");
  if(!e||Array.isArray(e)||Object.keys(e).sort().join(",")!==keys||
    e.phoneNumberId!=="107612478652254"||
    typeof e.providerMessageId!=="string"||!/^wamid\.[\w=+./:-]{1,400}$/.test(e.providerMessageId)||
    typeof e.sender!=="string"||!/^\d{7,15}$/.test(e.sender)||
    (delivery ? e.kind!=="status" || e.body!==null || e.providerTimestamp===null : !["text","unsupported"].includes(e.kind))||
    (e.body!==null&&(typeof e.body!=="string"||e.body.length>16000))||
    (e.providerTimestamp!==null&&(typeof e.providerTimestamp!=="string"||!/^\d{1,13}$/.test(e.providerTimestamp))))throw Error("inbound_forward_invalid");
  return Object.freeze({...e,organizationId,channel:"whatsapp"});
 });
}
