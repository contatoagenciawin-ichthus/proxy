import {currentPlatformAdmin} from '@/lib/meta-admin/auth'
import {getConnectionWorkflowAdminRuntime} from '@/lib/meta-admin/connection-workflow-admin-runtime.mjs'
import {handleConnectionWorkflowHttp} from '@/lib/meta-admin/connection-workflow-http.mjs'
export const runtime='nodejs'
export const dynamic='force-dynamic'
export async function GET(request:Request){
 return handleConnectionWorkflowHttp(request,{env:process.env,resolveOperator:currentPlatformAdmin,
   getRuntime:getConnectionWorkflowAdminRuntime})
}
export async function POST(request:Request){
 return handleConnectionWorkflowHttp(request,{env:process.env,resolveOperator:currentPlatformAdmin,
   getRuntime:getConnectionWorkflowAdminRuntime})
}
