import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// Staged CRM->Proxy transport binding, not an OAuth callback or HTTP route.
// Separate request key from OAuth-state, permit and Meta App secrets.
// The authenticated CRM server issues this AFTER state consumption commits.
const AUD="proxy-tech-provider:ichthus:oauth-request:v1";
const fail=()=>{throw Error("proxy_oauth_request_invalid")};
const sha=value=>createHash("sha256").update(value,"utf8").digest("hex");
const mac=(payload,secret)=>createHmac("sha256",secret).update(payload).digest("base64url");
const b64=/^[a-zA-Z0-9_-]+$/;
const hex=/^[a-f0-9]{64}$/;
const validSecret=s=>typeof s==="string"&&s.length>=32;

function validateInputs({permit,code,requestId,secret,now}){
 if(!validSecret(secret)||typeof permit!=="string"||permit.length<32||permit.length>4096||
    typeof code!=="string"||code.length<12||code.length>4096||code.trim()!==code||/\s/.test(code)||
    typeof requestId!=="string"||requestId.length<32||requestId.length>128||!b64.test(requestId)||
    !Number.isSafeInteger(now)||now<0)fail();
}
export function issueIchthusProxyOAuthRequest({permit,code,requestId,secret,now=Date.now()}){
 validateInputs({permit,code,requestId,secret,now});
 const body=Buffer.from(JSON.stringify({
  v:1,aud:AUD,requestId,permitDigest:sha(permit),codeDigest:sha(code),
  issuedAt:now,expiresAt:now+60_000,
 })).toString("base64url");
 return body+"."+mac(body,secret);
}
export function verifyIchthusProxyOAuthRequest({binding,permit,code,secret,now=Date.now()}){
 if(typeof binding!=="string"||binding.length>2048||!validSecret(secret)||
    !Number.isSafeInteger(now)||typeof permit!=="string"||typeof code!=="string")fail();
 const parts=binding.split(".");
 if(parts.length!==2||!parts.every(v=>b64.test(v)))fail();
 const [encoded,signature]=parts;
 const given=Buffer.from(signature,"base64url");
 const expected=Buffer.from(mac(encoded,secret),"base64url");
 if(given.toString("base64url")!==signature||given.length!==expected.length||
    !timingSafeEqual(given,expected))fail();
 const binary=Buffer.from(encoded,"base64url");
 if(binary.toString("base64url")!==encoded)fail();
 let payload;
 try{payload=JSON.parse(binary.toString("utf8"))}catch{fail()}
 if(!payload||payload.v!==1||payload.aud!==AUD||
    !b64.test(payload.requestId??"")||payload.requestId.length<32||payload.requestId.length>128||
    !hex.test(payload.permitDigest??"")||payload.permitDigest!==sha(permit)||
    !hex.test(payload.codeDigest??"")||payload.codeDigest!==sha(code)||
    !Number.isSafeInteger(payload.issuedAt)||!Number.isSafeInteger(payload.expiresAt)||
    payload.expiresAt-payload.issuedAt!==60_000||now<payload.issuedAt||now>=payload.expiresAt)fail();
 return Object.freeze({requestId:payload.requestId,permitDigest:payload.permitDigest,codeDigest:payload.codeDigest});
}
