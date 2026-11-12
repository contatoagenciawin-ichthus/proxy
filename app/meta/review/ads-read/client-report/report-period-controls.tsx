"use client"
import {useState} from "react"
const KEY="proxy_meta_ads_read_review"
type Insight={date_start?:string;date_stop?:string}
function iso(d:Date){return d.toISOString().slice(0,10)}
function datesFor(preset:string){
 const today=new Date(),utc=new Date(Date.UTC(today.getFullYear(),today.getMonth(),today.getDate()))
 let start=new Date(utc),end=new Date(utc)
 if(preset==="last7")start.setUTCDate(start.getUTCDate()-6)
 if(preset==="last30")start.setUTCDate(start.getUTCDate()-29)
 if(preset==="thisMonth")start=new Date(Date.UTC(utc.getUTCFullYear(),utc.getUTCMonth(),1))
 if(preset==="previousMonth"){
  start=new Date(Date.UTC(utc.getUTCFullYear(),utc.getUTCMonth()-1,1))
  end=new Date(Date.UTC(utc.getUTCFullYear(),utc.getUTCMonth(),0))
 }
 return {since:iso(start),until:iso(end)}
}
export function ReportPeriodControls({accountId,insights}:{accountId:string;insights:Insight}){
 const [since,setSince]=useState(insights.date_start||datesFor("last30").since)
 const [until,setUntil]=useState(insights.date_stop||datesFor("last30").until)
 const [preset,setPreset]=useState("custom")
 const [loading,setLoading]=useState(false)
 const [message,setMessage]=useState("")
 async function load(){
  if(loading)return
  setLoading(true);setMessage("Consultando o intervalo escolhido na Meta...")
  try{
   const response=await fetch("/api/meta/admin/ads/refresh",{method:"POST",cache:"no-store",
    headers:{"content-type":"application/json"},body:JSON.stringify({accountId,since,until})})
   const data=await response.json()
   if(!response.ok||!data.ok)throw Error(data.error||"Não foi possível consultar os dados.")
   if(data.adAccounts?.length!==1||data.adAccounts[0].id!==accountId||!data.adAccounts[0].insights||
     data.campaignInsightsByAccount?.[accountId]?.error)
     throw Error("A Meta não retornou os indicadores completos do intervalo. O relatório anterior foi preservado.")
   const oldRaw=window.sessionStorage.getItem(KEY)
   const old=oldRaw?JSON.parse(oldRaw):{}
   const otherAccounts=Array.isArray(old.adAccounts)?old.adAccounts.filter((a:{id:string})=>a.id!==accountId):[]
   window.sessionStorage.setItem(KEY,JSON.stringify({
    ...old,completedAt:data.completedAt,
    adAccounts:[...otherAccounts,...data.adAccounts],
    campaignInsightsByAccount:{...(old.campaignInsightsByAccount||{}),...data.campaignInsightsByAccount},
    reportPeriodByAccount:{...(old.reportPeriodByAccount||{}),[accountId]:{since,until,completedAt:data.completedAt}},
   }))
   window.location.reload()
  }catch(e){setMessage(e instanceof Error?e.message:"Falha ao atualizar relatório.")}
  finally{setLoading(false)}
 }
 return <div className="client-report-period flex flex-wrap items-end gap-3 border border-black/10 bg-white p-4 text-sm">
  <label className="flex flex-col gap-1"><span>Intervalo</span>
   <select value={preset} onChange={e=>{const value=e.target.value;setPreset(value);
    if(value!=="custom"){const range=datesFor(value);setSince(range.since);setUntil(range.until)}
   }} className="border border-black/20 bg-white px-3 py-2">
    <option value="custom">Personalizado</option><option value="last7">Últimos 7 dias</option>
    <option value="last30">Últimos 30 dias</option><option value="thisMonth">Mês atual</option>
    <option value="previousMonth">Mês anterior</option>
   </select>
  </label>
  <label className="flex flex-col gap-1"><span>Início</span><input type="date" value={since} max={until}
   onChange={e=>{setPreset("custom");setSince(e.target.value)}} className="border border-black/20 px-3 py-2"/></label>
  <label className="flex flex-col gap-1"><span>Fim</span><input type="date" value={until} min={since} max={iso(new Date())}
   onChange={e=>{setPreset("custom");setUntil(e.target.value)}} className="border border-black/20 px-3 py-2"/></label>
  <button type="button" disabled={loading||!since||!until||since>until} onClick={load}
   className="bg-[#173f49] px-4 py-2.5 font-semibold text-white disabled:opacity-50">
   {loading?"Consultando...":"Atualizar relatório"}</button>
  {message&&<p role="status" className="w-full text-xs">{message}</p>}
 </div>
}
