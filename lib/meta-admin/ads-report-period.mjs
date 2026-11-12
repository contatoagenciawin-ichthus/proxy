// Pure contract for user-selected Meta Ads reporting periods.
// No requests to Graph are made until this validation succeeds.
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const ACCOUNT=/^act_[0-9]{5,24}$/;
export function validateReportRequest(input,now=new Date()){
 if(!input||typeof input!=='object'||Array.isArray(input)||
   !Object.keys(input).every(k=>['accountId','since','until'].includes(k)))
  throw Error('invalid_report_request');
 const {accountId,since,until}=input;
 if(typeof accountId!=='string'||!ACCOUNT.test(accountId)||
  typeof since!=='string'||!DATE.test(since)||
  typeof until!=='string'||!DATE.test(until))throw Error('invalid_report_request');
 const start=new Date(since+'T00:00:00.000Z'),end=new Date(until+'T00:00:00.000Z');
 if(Number.isNaN(start.getTime())||Number.isNaN(end.getTime())||
  start.toISOString().slice(0,10)!==since||end.toISOString().slice(0,10)!==until||
  start>end||end.getTime()>Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate())||
  (end-start)/86400000>365)throw Error('invalid_report_dates');
 return {accountId,since,until};
}
export function reportTimeRange({since,until}){
 return 'time_range='+encodeURIComponent(JSON.stringify({since,until}));
}
