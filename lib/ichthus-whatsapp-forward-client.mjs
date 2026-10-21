import { signIchthusInboundForward } from "./ichthus-whatsapp-forward-contract.mjs";
// Pure staged service-to-service transport adapter. The upstream controller
// MUST verify X-Hub-Signature-256 against the real Meta App Secret BEFORE this.
// No Meta App Secret, tokens, WABA settings or webhook subscriptions here.
export async function forwardIchthusVerifiedWhatsApp({
 events,secret,endpoint,fetchImpl,now=Date.now(),
}) {
 if(!Array.isArray(events)||events.length===0||events.length>50||
    typeof secret!=="string"||secret.length<32||
    typeof endpoint!=="string"||typeof fetchImpl!=="function"||
    !Number.isSafeInteger(now)||now<0)throw Error("ichthus_forward_unavailable");
 let url;
 try{url=new URL(endpoint)}catch{throw Error("ichthus_forward_unavailable")}
 if(url.protocol!=="https:"||url.username||url.password||url.search||url.hash||
    url.pathname!=="/api/relationship/whatsapp/inbound")throw Error("ichthus_forward_unavailable");
 const normalized=events.map(e=>{
  if(!e||e.phoneNumberId!=="107612478652254"||
     typeof e.providerMessageId!=="string"||!/^wamid\.[\w=+./:-]{1,400}$/.test(e.providerMessageId)||
     typeof e.sender!=="string"||!/^\d{7,15}$/.test(e.sender)||
     !["text","unsupported"].includes(e.kind)||
     (e.body!==null&&(typeof e.body!=="string"||e.body.length>16000))||
     (e.timestamp!==null&&e.timestamp!==undefined&&(typeof e.timestamp!=="string"||!/^\d{1,13}$/.test(e.timestamp))))throw Error("ichthus_forward_unavailable");
  return {phoneNumberId:e.phoneNumberId,providerMessageId:e.providerMessageId,sender:e.sender,
    kind:e.kind,body:e.body,providerTimestamp:e.timestamp??null};
 });
 const rawBody=Buffer.from(JSON.stringify({version:1,events:normalized}));
 const timestamp=String(now);
 const signature=signIchthusInboundForward({rawBody,timestamp,secret});
 const res=await fetchImpl(url.toString(),{
  method:"POST",
  headers:{"content-type":"application/json","x-proxy-inbound-timestamp":timestamp,"x-proxy-inbound-signature":signature},
  body:rawBody,
  cache:"no-store",
  redirect:"error",
 });
 if(!res?.ok)throw Error("ichthus_forward_delivery_failed");
 return {forwarded:normalized.length};
}
