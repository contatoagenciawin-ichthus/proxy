import { handleIchthusMetaWebhook } from "../../../../../lib/ichthus-meta-webhook-handler.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
// Separate Ichthus endpoint; disabled by default, no legacy webhook edits.
export const POST=(request:Request)=>handleIchthusMetaWebhook(request);
