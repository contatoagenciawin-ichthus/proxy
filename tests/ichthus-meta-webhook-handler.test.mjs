import test from "node:test";
import assert from "node:assert/strict";
import {createHmac} from "node:crypto";
import {handleIchthusMetaWebhook} from "../lib/ichthus-meta-webhook-handler.mjs";
import {verifyIchthusInboundForward} from "../lib/ichthus-whatsapp-forward-contract.mjs";
const metaSecret="TEST_ONLY_ICH_META_APP_SECRET_1234567890",secret="TEST_ONLY_ICH_FORWARD_KEY_1234567890123";
const now=1792570000000;
function fake(phone="107612478652254"){
 const raw=Buffer.from(JSON.stringify({object:"whatsapp_business_account",entry:[{changes:[{field:"messages",value:{
  metadata:{phone_number_id:phone},messages:[{id:"wamid.synthetic_123",from:"5511999000000",type:"text",text:{body:"Orçamento"},timestamp:"1792500000"}]
 }}]}]}));
 return new Request("https://proxy.invalid/api/meta/ichthus/whatsapp/webhook",{method:"POST",headers:{
  "content-type":"application/json","x-hub-signature-256":"sha256="+createHmac("sha256",metaSecret).update(raw).digest("hex")
 },body:raw});
}
const env={ICHTHUS_META_WHATSAPP_INGRESS_ENABLED:"true",META_APP_SECRET:metaSecret,
 ICHTHUS_WHATSAPP_FORWARD_SECRET:secret,
 ICHTHUS_WHATSAPP_CRM_ENDPOINT:"https://crm.example.invalid/api/relationship/whatsapp/inbound"};
test("G2 default disabled cannot reach downstream CRM",async()=>{
 let n=0;const result=await handleIchthusMetaWebhook(fake(),{env:{...env,ICHTHUS_META_WHATSAPP_INGRESS_ENABLED:"false"},fetchImpl:async()=>{n++;return {ok:true}},now});
 assert.equal(result.status,503);assert.equal(n,0);
});
test("G2 Meta-authenticated Ichthus message forwards signed narrow payload",async()=>{
 let n=0;
 const response=await handleIchthusMetaWebhook(fake(),{env,now,fetchImpl:async(url,req)=>{
  n++;
  assert.equal(url,env.ICHTHUS_WHATSAPP_CRM_ENDPOINT);
  assert.equal(verifyIchthusInboundForward({rawBody:Buffer.from(req.body),timestamp:req.headers["x-proxy-inbound-timestamp"],signature:req.headers["x-proxy-inbound-signature"],secret,now}),true);
  assert.ok(!Buffer.from(req.body).toString().includes(metaSecret));
  return {ok:true};
 }});
 assert.equal(response.status,200);assert.equal(n,1);
});
test("G2 rejects foreign phone and forged Meta signature before downstream",async()=>{
 let n=0;
 const fetchImpl=async()=>{n++;return {ok:true}};
 assert.equal((await handleIchthusMetaWebhook(fake("123123123123"),{env,fetchImpl,now})).status,400);
 const forged=fake();forged.headers.set("x-hub-signature-256","sha256="+"0".repeat(64));
 assert.equal((await handleIchthusMetaWebhook(forged,{env,fetchImpl,now})).status,401);
 assert.equal(n,0);
});
test("G2 CRM outage does not falsely acknowledge WhatsApp receipt",async()=>{
 const response=await handleIchthusMetaWebhook(fake(),{env,now,fetchImpl:async()=>({ok:false})});
 assert.equal(response.status,503);
});

test("G2 streaming ingress bounds chunked payload before allocating full request",async()=>{
 const oversized=Buffer.alloc(1024*1024+1,32);
 const forged=new Request("https://proxy.invalid/api/meta/ichthus/whatsapp/webhook",{
  method:"POST",headers:{"content-type":"application/json"},body:oversized,
 });
 let calls=0;
 const res=await handleIchthusMetaWebhook(forged,{env,now,fetchImpl:async()=>{calls++;return {ok:true}}});
 assert.equal(res.status,413);
 assert.equal(calls,0);
});
