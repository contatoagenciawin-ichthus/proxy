import test from "node:test";
import assert from "node:assert/strict";
import { issueIchthusProxyExchangePermit, verifyIchthusProxyExchangePermit } from "../lib/ichthus-crm-exchange-permit.mjs";

const organizationId="1715a7b9-5209-4e7c-8439-84658061904f";
const configId="3237839906603757";
const secret="TEST_ONLY_CRM_Proxy_permit_secret_32_bytes_min";
const now=1792410000000;
const input={organizationId,configId,nonceDigest:"a".repeat(64),permitId:"b".repeat(40),secret,now};
const verify=(permit,overrides={})=>verifyIchthusProxyExchangePermit({
 permit,secret,expectedOrganizationId:organizationId,expectedConfigId:configId,now:now+1000,...overrides,
});

test("Proxy rejects permits for other tenants, config, secrets and expired state",()=>{
 const permit=issueIchthusProxyExchangePermit(input);
 assert.equal(verify(permit).wabaId,"107697061976892");
 assert.equal(verify(permit).phoneNumberId,"107612478652254");
 assert.equal(verify(permit).nonceDigest,input.nonceDigest);
 for(const overrides of [
  {expectedOrganizationId:"22222222-2222-4222-8222-222222222222"},
  {expectedConfigId:"1234567890"}, {now:now+60000}, {secret:"invalid-different-secret-32-bytes-minimum"},
 ])assert.throws(()=>verify(permit,overrides),/proxy_exchange_permit_invalid/);
});

test("Proxy fails closed for forged, malformed and noncanonical permits",()=>{
 const permit=issueIchthusProxyExchangePermit(input);
 for(const broken of ["",permit+".extra",permit.slice(0,-1),permit.split(".")[0]+".invalid"]){
  assert.throws(()=>verify(broken),/proxy_exchange_permit_invalid/);
 }
 assert.throws(()=>issueIchthusProxyExchangePermit({...input,secret:"short"}),/proxy_exchange_permit_invalid/);
});
