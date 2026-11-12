import test from "node:test";
import assert from "node:assert/strict";
import {validateReportRequest,reportTimeRange} from "../lib/meta-admin/ads-report-period.mjs";
import {analyzeCampaigns} from "../lib/meta-admin/ads-report-analysis.mjs";
const now=new Date("2026-11-12T18:00:00Z");
test("selected account/date range is validated and Meta request time_range encoded",()=>{
 const x=validateReportRequest({accountId:"act_123456789",since:"2026-10-13",until:"2026-11-11"},now);
 assert.equal(x.until,"2026-11-11");
 assert.deepEqual(JSON.parse(decodeURIComponent(reportTimeRange(x).slice("time_range=".length))),{since:"2026-10-13",until:"2026-11-11"});
});
test("invalid, future, inverted and oversized reporting periods fail before Graph",()=>{
 for(const request of [
  {accountId:"act_123456789",since:"2026-11-13",until:"2026-11-13"},
  {accountId:"act_123456789",since:"2026-11-11",until:"2026-10-13"},
  {accountId:"act_123456789",since:"2025-01-01",until:"2026-11-11"},
  {accountId:"act_123456789",since:"2026-02-30",until:"2026-03-01"},
  {accountId:"act_123456789",since:"2026-10-01",until:"2026-11-11",extra:"unsafe"},
  {accountId:"foo",since:"2026-10-01",until:"2026-11-11"}
 ])assert.throws(()=>validateReportRequest(request,now),/invalid_report/);
});
test("campaign insights use directly attributed actions, not clicks to infer conversions",()=>{
 const result=analyzeCampaigns([
  {campaign_id:"1",campaign_name:"Ago 2026 Campaign",spend:"400",clicks:"429",impressions:"42699",ctr:"1.00",frequency:"4.21",
   actions:[{action_type:"onsite_conversion.messaging_conversation_started_7d",value:"20"}]},
  {campaign_id:"2",campaign_name:"Other",spend:"200",clicks:"240",impressions:"16130",ctr:"1.49",frequency:"1.7"}
 ],{spend:"600"});
 assert.equal(result.reports[0].action.cost,20);
 assert.equal(result.reports[1].action,null);
 assert.equal(result.reports[0].share,66.7);
 assert.ok(result.reports[0].flags.some(x=>x.includes("Frequência")));
 assert.ok(result.reports[1].flags.some(x=>x.includes("cliques não equivalem a leads")));
 assert.ok(result.dataWarnings.some(x=>x.includes("faturamento")));
});
