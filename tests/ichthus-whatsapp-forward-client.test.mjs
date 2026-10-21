import test from "node:test";
import assert from "node:assert/strict";
import { forwardIchthusVerifiedWhatsApp } from "../lib/ichthus-whatsapp-forward-client.mjs";
import {verifyIchthusInboundForward,parseIchthusInboundForward} from "../lib/ichthus-whatsapp-forward-contract.mjs";
const secret="TEST_ONLY_PROXY_CRM_WHATSAPP_SHARED_HMAC_KEY_12345",now=1792570000000;
const events=[{phoneNumberId:"107612478652254",providerMessageId:"wamid.synthetic_forward_123",
 sender:"5511999000000",kind:"text",body:"Quero orçamento",timestamp:"1792500000"}];
test("G2 central forwarding emits verifiable, minimal server-only payload",async()=>{
 let calls=0;
 const result=await forwardIchthusVerifiedWhatsApp({
  events,secret,endpoint:"https://crm.example.invalid/api/relationship/whatsapp/inbound",now,
  fetchImpl:async(url,req)=>{
   calls++;
   assert.equal(url,"https://crm.example.invalid/api/relationship/whatsapp/inbound");
   const rawBody=Buffer.from(req.body);
   assert.equal(verifyIchthusInboundForward({rawBody,timestamp:req.headers["x-proxy-inbound-timestamp"],signature:req.headers["x-proxy-inbound-signature"],secret,now}),true);
   const parsed=parseIchthusInboundForward(rawBody);
   assert.equal(parsed[0].body,"Quero orçamento");
   assert.equal(parsed[0].organizationId,"1715a7b9-5209-4e7c-8439-84658061904f");
   assert.equal(Object.hasOwn(parsed[0],"accessToken"),false);
   return {ok:true};
  },
 });
 assert.equal(calls,1);
 assert.deepEqual(result,{forwarded:1});
});
test("G2 forwarding rejects unapproved phone, non-TLS and failure",async()=>{
 let calls=0;
 const fetchImpl=async()=>{calls++;return {ok:true}};
 for(const options of [
  {events:[{...events[0],phoneNumberId:"999999999999"}]},
  {endpoint:"http://crm.example.invalid/api/relationship/whatsapp/inbound"},
  {endpoint:"https://crm.example.invalid/api/relationship/whatsapp/inbound?debug=1"},
 ])await assert.rejects(forwardIchthusVerifiedWhatsApp({
  events,endpoint:"https://crm.example.invalid/api/relationship/whatsapp/inbound",secret,fetchImpl,now,...options,
 }),/ichthus_forward_unavailable/);
 assert.equal(calls,0);
 await assert.rejects(forwardIchthusVerifiedWhatsApp({
  events,endpoint:"https://crm.example.invalid/api/relationship/whatsapp/inbound",
  secret,fetchImpl:async()=>({ok:false}),now,
 }),/ichthus_forward_delivery_failed/);
});
