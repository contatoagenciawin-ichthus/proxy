import test from "node:test";
import assert from "node:assert/strict";
import {createHmac} from "node:crypto";
import {handleIchthusHumanOutbound} from "../lib/ichthus-human-outbound-handler.mjs";

const secret="this-is-a-test-secret-never-used-in-production-12345";
const env={VERCEL_ENV:"production",PROXY_ICHTHUS_WHATSAPP_SEND_ENABLED:"true",ICHTHUS_WHATSAPP_FORWARD_SECRET:secret};
const now=Date.now();
const reply={v:1,requestId:"123e4567-e89b-42d3-a456-426614174000",recipient:"5511999000000",body:"Obrigado pelo contato!"};
function request(data=reply,options={}){
 const text=JSON.stringify(data),stamp=String(options.timestamp??now);
 const signature=createHmac("sha256",options.secret||secret)
  .update("ichthus-outbound-v1\n"+stamp+"\n"+text).digest("hex");
 return new Request("https://app.proxyone.tech/api/meta/ichthus/whatsapp/outbound",{
  method:"POST",headers:{"content-type":"application/json",
   "x-proxy-outbound-timestamp":stamp,
   "x-proxy-outbound-signature":"sha256="+signature,...(options.headers||{})},body:text});
}
test("valid signed CRM request sends only one scoped text",async()=>{
 const calls=[];
 const res=await handleIchthusHumanOutbound(request(),{
  env,now,send:async input=>{calls.push(input);return {status:"accepted",providerMessageId:"wamid.HBgLMQ=="}}
 });
 assert.equal(res.status,200);
 assert.equal((await res.json()).providerMessageId,"wamid.HBgLMQ==");
 assert.equal(calls.length,1);
 assert.equal(calls[0].organizationId,"e9b935b6-3349-4b2c-970d-be8ad3bc243d");
 assert.equal(calls[0].phoneNumberId,"107612478652254");
 assert.equal(calls[0].recipient,reply.recipient);
});
test("disabled flag, invalid signature, stale timestamp and browser cookies are blocked",async()=>{
 let called=0;const send=async()=>{called++;return {status:"accepted",providerMessageId:"wamid.x"}};
 const requests=[
  [request(),{...env,PROXY_ICHTHUS_WHATSAPP_SEND_ENABLED:"false"},now],
  [request(reply,{secret:"different-test-secret-is-long-enough"}),env,now],
  [request(reply,{timestamp:now-300000}),env,now],
  [request(reply,{headers:{cookie:"session=browser"}}),env,now]
 ];
 for(const [req,e,t] of requests)assert.notEqual((await handleIchthusHumanOutbound(req,{env:e,now:t,send})).status,200);
 assert.equal(called,0);
});
test("recipient cannot be substituted outside request contract",async()=>{
 let called=0;
 const res=await handleIchthusHumanOutbound(request({...reply,recipient:"+5511999000000"}),{
  env,now,send:async()=>{called++;return {status:"accepted",providerMessageId:"wamid.x"}}
 });
 assert.equal(res.status,403);
 assert.equal(called,0);
});
test("uncertain provider result does not claim sent message",async()=>{
 const res=await handleIchthusHumanOutbound(request(),{
  env,now,send:async()=>({status:"uncertain"})});
 assert.equal(res.status,502);
 assert.equal((await res.json()).status,"uncertain");
});
