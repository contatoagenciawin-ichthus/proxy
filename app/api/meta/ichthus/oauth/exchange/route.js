import pg from "pg";
import { handleIchthusOAuthExchangeRequest } from "../../../../../../lib/ichthus-proxy-oauth-controller.mjs";
import { createIchthusProxyReplayStore } from "../../../../../../lib/ichthus-proxy-replay-pg-store.mjs";
import { consumeProxyPermitPostgresCommitted } from "../../../../../../lib/ichthus-proxy-permit-replay.mjs";
import { exchangeMetaAuthorization } from "../../../../../../lib/meta-authorization-exchange";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const organizationId = "e9b935b6-3349-4b2c-970d-be8ad3bc243d";
const json = (data,status) => Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
let pool;

async function readBody(request) {
  const reader=request.body?.getReader();
  if (!reader) throw Error("missing_body");
  const chunks=[];
  let size=0;
  try {
    while (true) {
      const part=await reader.read();
      if (part.done) break;
      size+=part.value.byteLength;
      if (size>12288) { await reader.cancel(); throw Error("body_too_large"); }
      chunks.push(part.value);
    }
    return Buffer.concat(chunks).toString("utf8");
  } finally {reader.releaseLock();}
}

export async function POST(request) {
  const env=process.env;
  if (env.ICHTHUS_PROXY_EXCHANGE_ENABLED!=="true" || env.VERCEL_ENV!=="production" ||
      env.ICHTHUS_META_HANDOFF_ENABLED!=="true" || !env.ICHTHUS_REPLAY_DATABASE_URL ||
      !/^\d{8,32}$/.test(env.ICHTHUS_META_COEXISTENCE_CONFIG_ID || "") ||
      !/^\d{8,32}$/.test(env.ICHTHUS_META_BUSINESS_ID || "") ||
      !env.META_APP_SECRET || env.ICHTHUS_META_HANDOFF_URL!=="https://crm.ichthusmkt.com.br/api/relationship/meta/credentials")
    return json({error:"unavailable"},503);
  const secrets=[env.ICHTHUS_OAUTH_REQUEST_SECRET,env.ICHTHUS_OAUTH_PERMIT_SECRET,env.ICHTHUS_HANDOFF_SIGNING_SECRET];
  if (secrets.some(key=>!key || key.length<32) || new Set([...secrets,env.META_APP_SECRET]).size!==4)
    return json({error:"unavailable"},503);
  let body;
  try {body=await readBody(request);} catch {return json({error:"invalid_body"},400);}
  try {
    if (!pool) {
      const url=new URL(env.ICHTHUS_REPLAY_DATABASE_URL);
      if (!["postgres:","postgresql:"].includes(url.protocol) ||
          url.username!=="proxy_meta_ichthus_replay_login" || !url.hostname.endsWith(".neon.tech")) throw Error("invalid_database");
      for (const key of ["sslmode","ssl","sslcert","sslkey","sslrootcert","uselibpqcompat"]) url.searchParams.delete(key);
      pool=new pg.Pool({connectionString:url.toString(),ssl:{rejectUnauthorized:true},max:2,connectionTimeoutMillis:5000,idleTimeoutMillis:1000,allowExitOnIdle:true});
      pool.on("error",()=>{});
    }
    const insertAndCommit=createIchthusProxyReplayStore({pool});
    const result=await handleIchthusOAuthExchangeRequest({
      request:{method:request.method,path:new URL(request.url).pathname,headers:request.headers,rawBody:body},
      enabled:true,verifiedServiceIdentity:"ichthus-crm-server",expectedOrganizationId:organizationId,
      configId:env.ICHTHUS_META_COEXISTENCE_CONFIG_ID,requestSecret:secrets[0],permitSecret:secrets[1],
      consumeOnce:input=>consumeProxyPermitPostgresCommitted({...input,insertAndCommit}),
      exchangeCode:async ({code,authorization})=>{
        const response=await exchangeMetaAuthorization({code,wabaId:authorization.wabaId,phoneNumberId:authorization.phoneNumberId},true);
        if (!response.ok || (await response.json()).tokenStored!==true) throw Error("exchange_unconfirmed");
      },
    });
    return json(result,200);
  } catch {return json({error:"exchange_unconfirmed"},409);}
}
