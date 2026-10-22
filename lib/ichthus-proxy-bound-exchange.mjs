import { verifyIchthusProxyOAuthRequest } from "./ichthus-proxy-oauth-request-binding.mjs";
import { executeIchthusProxyExchange } from "./ichthus-proxy-oauth-orchestrator.mjs";

// Staged security gate. Caller MUST use this instead of invoking the unguarded
// domain orchestrator directly. Does not expose an HTTP endpoint or contact Meta.
export async function executeBoundIchthusProxyExchange({
 binding,requestSecret,...exchange
}) {
 verifyIchthusProxyOAuthRequest({
  binding,permit:exchange.permit,code:exchange.code,
  secret:requestSecret,now:exchange.now,
 });
 return executeIchthusProxyExchange(exchange);
}
