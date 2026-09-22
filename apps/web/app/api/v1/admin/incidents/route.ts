import { NextResponse } from "next/server";
import { getAuthorizationContext } from "@/lib/auth/authorization";
import { createIncident, transitionIncident } from "@/lib/incident-response";
import { getRequestId } from "@/lib/security/request-id";

export const runtime="nodejs"; export const dynamic="force-dynamic";
export async function POST(request:Request){
 const requestId=getRequestId(request); const context=await getAuthorizationContext();
 if(!context.isAuthenticated||!context.isPrivileged||!context.userId) return NextResponse.json({error:"forbidden",requestId},{status:403});
 try{const body=await request.json();
  if(body.action==="transition"){const result=await transitionIncident({incidentId:String(body.incidentId),to:String(body.to),message:String(body.message??""),userId:context.userId,requestId});return NextResponse.json({data:result,requestId},{headers:{"cache-control":"no-store","x-request-id":requestId}});}
  const result=await createIncident({organizationId:context.organizationId,title:String(body.title??""),severity:String(body.severity??""),summary:String(body.summary??""),userId:context.userId,requestId,correlationId:body.correlationId?String(body.correlationId):undefined});
  return NextResponse.json({data:result,requestId},{status:201,headers:{"cache-control":"no-store","x-request-id":requestId}});
 }catch(error){const code=error instanceof Error?error.message:"incident_error";return NextResponse.json({error:code,requestId},{status:400,headers:{"cache-control":"no-store","x-request-id":requestId}});}
}
