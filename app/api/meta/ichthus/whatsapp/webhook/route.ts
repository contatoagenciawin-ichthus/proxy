import { handleIchthusMetaWebhook } from "../../../../../../lib/ichthus-meta-webhook-handler.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
// Separate Ichthus endpoint; disabled by default, no legacy webhook edits.
export const POST=(request:Request)=>handleIchthusMetaWebhook(request);

export const GET=(request:Request)=>{
 const env=process.env;
 if(env.ICHTHUS_META_WHATSAPP_INGRESS_ENABLED!=="true"||
    typeof env.ICHTHUS_META_WEBHOOK_VERIFY_TOKEN!=="string"||
    env.ICHTHUS_META_WEBHOOK_VERIFY_TOKEN.length<32)return new Response(null,{status:503});
 const url=new URL(request.url);
 if(url.searchParams.get("hub.mode")!=="subscribe"||
    url.searchParams.get("hub.verify_token")!==env.ICHTHUS_META_WEBHOOK_VERIFY_TOKEN)return new Response(null,{status:403});
 const challenge=url.searchParams.get("hub.challenge");
 if(!challenge||challenge.length>512||!/^[0-9a-zA-Z_-]+$/.test(challenge))return new Response(null,{status:400});
 return new Response(challenge,{status:200,headers:{"content-type":"text/plain; charset=utf-8","cache-control":"no-store"}});
};
