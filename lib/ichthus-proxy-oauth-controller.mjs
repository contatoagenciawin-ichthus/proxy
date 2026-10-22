// G2 INACTIVE controller contract. No HTTP route is registered here.
// The caller MUST provide trusted, server-side config and an authenticated
// CRM service identity, never an organization/config picked from request JSON.
// Browser and cross-origin traffic are rejected; TLS is enforced at ingress.
// No Meta API or customer credential access is implemented.
import { executeBoundIchthusProxyExchange } from "./ichthus-proxy-bound-exchange.mjs";

const fail=()=>{throw new Error("ichthus_proxy_controller_unavailable")};
const ORG="1715a7b9-5209-4e7c-8439-84658061904f";
const EXPECTED_METHOD="POST";
const EXPECTED_PATH="/api/meta/ichthus/oauth/exchange";
const forbiddenHeaders=["cookie","authorization","origin","referer","sec-fetch-site"];
const get=(headers,key)=>headers?.get?.(key)??headers?.[key]??headers?.[key.toLowerCase()]??null;

export async function handleIchthusOAuthExchangeRequest({
 request, enabled=false, verifiedServiceIdentity, permitSecret,
 requestSecret, configId, consumeOnce, exchangeCode, now=Date.now(),
}) {
 if(enabled!==true||verifiedServiceIdentity!=="ichthus-crm-server"||
    typeof configId!=="string"||!/^\d{8,32}$/.test(configId)||
    !request||request.method!==EXPECTED_METHOD||
    request.path!==EXPECTED_PATH||
    get(request.headers,"content-type")!=="application/json"||
    forbiddenHeaders.some(h=>get(request.headers,h)!==null)||
    typeof request.rawBody!=="string"||
    Buffer.byteLength(request.rawBody,"utf8")>12288||
    typeof consumeOnce!=="function"||typeof exchangeCode!=="function") fail();
 let body;
 try { body=JSON.parse(request.rawBody) } catch { fail() }
 if(!body||Array.isArray(body)||typeof body!=="object"||
    Object.keys(body).sort().join(",")!=="binding,code,permit"||
    typeof body.binding!=="string"||typeof body.code!=="string"||
    typeof body.permit!=="string")fail();
 return executeBoundIchthusProxyExchange({
  binding:body.binding,permit:body.permit,code:body.code,
  requestSecret,secret:permitSecret,
  expectedOrganizationId:ORG,expectedConfigId:configId,
  consumeOnce,exchangeCode,now,
 });
}
