import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCoexistenceEntries } from "../lib/ichthus-coexistence-events.mjs";
import { forwardIchthusVerifiedWhatsApp } from "../lib/ichthus-whatsapp-forward-client.mjs";
import { parseIchthusInboundForward, verifyIchthusInboundForward } from "../lib/ichthus-whatsapp-forward-contract.mjs";

const metadata = { phone_number_id:"107612478652254" };
const customer = "5511990000000";
const id = "wamid.fixture1";
const echo = {field:"smb_message_echoes", value:{metadata, message_echoes:[
  {from:"5519998056642",to:customer,id,type:"text",text:{body:"Mensagem de teste"},timestamp:"1792500000"}
]}};
const status = {field:"messages", value:{metadata, statuses:[
  {id, recipient_id:customer, status:"delivered",timestamp:"1792500001"}
]}};
const entry = {id:"107697061976892", changes:[echo,status]};

test("echo and delivery of the same message survive the signed transport as distinct events",async()=>{
  const events=normalizeCoexistenceEntries([entry]);
  const secret="TEST_ONLY_key_for_cross_service_contract";
  const now=1792500001000;
  await forwardIchthusVerifiedWhatsApp({events,secret,now,endpoint:"https://crm.invalid/api/relationship/whatsapp/inbound",
    fetchImpl:async(_url,request)=>{
      assert.ok(verifyIchthusInboundForward({rawBody:request.body, timestamp:String(now),
        signature:request.headers["x-proxy-inbound-signature"],secret,now}));
      const [out,delivery]=parseIchthusInboundForward(request.body);
      assert.deepEqual([out.sender,out.eventType,out.providerMessageId],[customer,"echo",id]);
      assert.deepEqual([delivery.sender,delivery.eventType,delivery.body],[customer,"delivered",null]);
      return {ok:true};
    }});
});
test("foreign WABA or echo from a different business is rejected",()=>{
  assert.throws(()=>normalizeCoexistenceEntries([entry,{...entry,id:"foreign"}]),/unexpected_waba/);
  const wrong=structuredClone(entry);
  wrong.changes[0].value.message_echoes[0].from=customer;
  assert.throws(()=>normalizeCoexistenceEntries([wrong]),/invalid_participants/);
});
