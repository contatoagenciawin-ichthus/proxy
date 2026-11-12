// Deterministic commentary: no model calls, assumptions about revenue or fabricated comparisons.
const num=v=>Number.isFinite(Number(v))?Math.max(0,Number(v)):0;
const pct=v=>Math.round(v*10)/10;
const businessType=t=>{
 const x=String(t||"").toLowerCase();
 return x.includes("messaging_conversation_started")||x.includes("messaging_first_reply")||
  x==="lead"||x.includes("onsite_conversion.lead_grouped")||x.includes("contact");
};
const label=t=>{
 const x=String(t).toLowerCase();
 if(x.includes("messaging_conversation_started"))return "conversa iniciada";
 if(x.includes("messaging_first_reply"))return "primeira resposta";
 if(x.includes("lead"))return "lead atribuído";
 if(x.includes("contact"))return "contato atribuído";
 return "resultado atribuído";
};
export function analyzeCampaigns(rows,account){
 const campaigns=Array.isArray(rows)?rows:[];
 const spent=campaigns.reduce((a,x)=>a+num(x.spend),0);
 const insights=account||{};
 const reports=campaigns.map(c=>{
  const spend=num(c.spend),clicks=num(c.clicks),impressions=num(c.impressions);
  const acts=(Array.isArray(c.actions)?c.actions:[])
   .filter(x=>businessType(x.action_type)&&num(x.value)>0)
   .map(x=>({type:x.action_type,label:label(x.action_type),count:num(x.value),
      cost:spend/num(x.value)}));
  const priority=acts.find(a=>a.type?.includes("messaging_conversation_started"))||
    acts.find(a=>a.type?.includes("lead"))||acts[0]||null;
  const flags=[];
  if(spend>0&&!priority)flags.push("Sem resultado comercial atribuível nas métricas recebidas; cliques não equivalem a leads.");
  if(impressions>=1000&&Number(c.ctr)<0.7)flags.push("CTR inferior a 0,7% com pelo menos 1.000 impressões: investigar criativo, segmentação e posicionamento.");
  if(num(c.frequency)>=4)flags.push("Frequência igual ou superior a 4: conferir evolução temporal e possível desgaste, sem concluir saturação isoladamente.");
  if(spend>0&&spent>0&&spend/spent>=0.6&&campaigns.filter(x=>num(x.spend)>0).length>1)
   flags.push("Concentra pelo menos 60% da verba: confirmar se o volume de resultados justifica essa distribuição.");
  return {id:String(c.campaign_id||""),name:String(c.campaign_name||c.campaign_id||"Campanha"),
   spend,share:spent>0?pct(100*spend/spent):0,clicks,impressions,
   ctr:num(c.ctr),cpc:num(c.cpc),frequency:num(c.frequency),
   action:priority,actions:acts,flags};
 });
 const comparisons=[];
 const successful=reports.filter(x=>x.action&&x.spend>0);
 if(successful.length>=2){
  const grouped=new Map();
  for(const c of successful){
   const kind=c.action.type;
   if(!grouped.has(kind))grouped.set(kind,[]);
   grouped.get(kind).push(c);
  }
  for(const group of grouped.values())if(group.length>=2){
   const ordered=group.slice().sort((a,b)=>a.action.cost-b.action.cost);
   const first=ordered[0],last=ordered[ordered.length-1];
   comparisons.push(`Para a ação "${first.action.label}", "${first.name}" registrou custo de ${first.action.cost.toFixed(2)} por ocorrência e "${last.name}" ${last.action.cost.toFixed(2)}. Avaliar também a qualidade comercial antes de redistribuir verba.`);
  }
 }
 const accountSpend=num(insights.spend);
 const discrepancy=accountSpend>0&&spent>0?Math.abs(accountSpend-spent)/accountSpend:null;
 const dataWarnings=[
  ...(discrepancy!==null&&discrepancy>0.03?["O investimento somado das campanhas difere mais de 3% do total da conta; pode haver paginação ou linhas ausentes."]:[]),
  ...(!reports.length?["Nenhuma linha de campanha retornada para o período selecionado."]:[]),
  "Indicadores de atribuição da Meta não demonstram faturamento, agendamentos nem qualidade dos contatos sem dados comerciais externos."
 ];
 return {reports,comparisons,dataWarnings,accountSpend,reportedCampaignSpend:spent};
}
