import { createHmac, timingSafeEqual } from "node:crypto";

// G2 pure protocol: CRM -> Proxy Tech Provider exchange permit.
// NOT an OAuth callback or network client. No Meta credentials are handled.
// The CRM must issue ONLY after a committed, one-time OAuth state consumption.
// The Proxy must maintain its OWN one-time replay ledger for permit ID.
const AUD="proxy-tech-provider:ichthus:oauth-code-exchange";
const WABA="107697061976892", PHONE="107612478652254";
const ORG=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEX=/^[a-f0-9]{64}$/;
const B64=/^[A-Za-z0-9_-]+$/;
const MAX_AGE=60_000;
const deny=()=>{throw new Error("proxy_exchange_permit_invalid")};
const validSecret=s=>typeof s==="string"&&s.length>=32;
const mac=(encoded,secret)=>createHmac("sha256",secret).update(encoded).digest("base64url");

export function issueIchthusProxyExchangePermit({
 organizationId,configId,nonceDigest,permitId,secret,now=Date.now(),
}) {
 if(!validSecret(secret)||!ORG.test(organizationId??"")||!/^\d{8,32}$/.test(configId??"")||
    !HEX.test(nonceDigest??"")||!B64.test(permitId??"")||permitId.length<32||permitId.length>128||
    !Number.isSafeInteger(now)||now<0)deny();
 const payload={
  v:1,aud:AUD,organizationId,wabaId:WABA,phoneNumberId:PHONE,
  configId,nonceDigest,permitId,issuedAt:now,expiresAt:now+MAX_AGE,
 };
 const encoded=Buffer.from(JSON.stringify(payload)).toString("base64url");
 return encoded+"."+mac(encoded,secret);
}

export function verifyIchthusProxyExchangePermit({permit,secret,expectedOrganizationId,expectedConfigId,now=Date.now()}) {
 if(!validSecret(secret)||typeof permit!=="string"||permit.length>4096||
    !ORG.test(expectedOrganizationId??"")||!/^\d{8,32}$/.test(expectedConfigId??"")||
    !Number.isSafeInteger(now))deny();
 const parts=permit.split(".");
 if(parts.length!==2||!parts.every(x=>B64.test(x)))deny();
 const [encoded,signature]=parts;
 const provided=Buffer.from(signature,"base64url");
 if(provided.toString("base64url")!==signature)deny();
 const wanted=Buffer.from(mac(encoded,secret),"base64url");
 if(provided.length!==wanted.length||!timingSafeEqual(provided,wanted))deny();
 const bytes=Buffer.from(encoded,"base64url");
 if(bytes.toString("base64url")!==encoded)deny();
 let data;
 try{data=JSON.parse(bytes.toString("utf8"))}catch{deny()}
 if(!data||data.v!==1||data.aud!==AUD||data.organizationId!==expectedOrganizationId||
    data.wabaId!==WABA||data.phoneNumberId!==PHONE||data.configId!==expectedConfigId||
    !HEX.test(data.nonceDigest??"")||!B64.test(data.permitId??"")||
    data.permitId.length<32||data.permitId.length>128||
    !Number.isSafeInteger(data.issuedAt)||!Number.isSafeInteger(data.expiresAt)||
    data.expiresAt-data.issuedAt!==MAX_AGE||now<data.issuedAt||now>=data.expiresAt)deny();
 return Object.freeze({
  organizationId:data.organizationId,wabaId:WABA,phoneNumberId:PHONE,
  configId:data.configId,nonceDigest:data.nonceDigest,permitId:data.permitId,
 });
}
