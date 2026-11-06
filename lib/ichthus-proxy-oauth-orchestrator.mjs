// G2 staged orchestration only. NO HTTP route, OAuth callback, Meta API,
// request parsing or Graph token persistence. The production controller MUST
// authenticate the CRM caller, bind code/state to its committed session and
// exact config, and inject the approved DB replay store before calling this.
import { consumeIchthusProxyPermit } from "./ichthus-proxy-permit-replay.mjs";

const reject=()=>{throw new Error("proxy_oauth_exchange_unavailable")};
export async function executeIchthusProxyExchange({
 permit,secret,expectedOrganizationId,expectedConfigId,code,
 consumeOnce,exchangeCode,now=Date.now(),
}) {
 if(typeof code!=="string"||code.length<12||code.length>4096||
    code.trim()!==code||/\s/.test(code)||
    typeof exchangeCode!=="function")reject();
 // Verification and durable, once-only consumption must finish BEFORE
 // any external exchange. Never wrap a network call in this DB transaction.
 const authorization=await consumeIchthusProxyPermit({
  permit,secret,expectedOrganizationId,expectedConfigId,consumeOnce,now,
 });
 // Never return raw code/token or log it. Caller must validate Graph metadata,
 // exact WABA/phone ownership and handoff authorization in the trusted backend.
 await exchangeCode({code,authorization});
 return Object.freeze({
  consumed:true,
  organizationId:authorization.organizationId,
  wabaId:authorization.wabaId,
  phoneNumberId:authorization.phoneNumberId,
 });
}
