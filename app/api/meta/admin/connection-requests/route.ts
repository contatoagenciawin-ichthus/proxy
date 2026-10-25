import {handleConnectionRequestHttp} from '@/lib/meta-admin/connection-request-http.mjs'
export const runtime='nodejs'
export const dynamic='force-dynamic'
// Deliberately no storage adapter until a scoped central database is provisioned.
// The endpoint therefore fails closed even if a flag is misconfigured.
export async function POST(request: Request){
 return handleConnectionRequestHttp(request,{env:process.env})
}
