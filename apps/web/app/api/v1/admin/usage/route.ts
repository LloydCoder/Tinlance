import { NextResponse } from "next/server";
import { getAuthorizationContext } from "@/lib/auth/authorization";
import { getUsageSummary } from "@/lib/usage/meter";
import { getRequestId } from "@/lib/security/request-id";

export const runtime="nodejs"; export const dynamic="force-dynamic";
export async function GET(request:Request){
 const requestId=getRequestId(request); const context=await getAuthorizationContext();
 if(!context.isAuthenticated) return NextResponse.json({error:"unauthorized",requestId},{status:401});
 if(!context.isPrivileged||!context.organizationId) return NextResponse.json({error:"forbidden",requestId},{status:403});
 const url=new URL(request.url); const to=new Date(url.searchParams.get("to")??new Date().toISOString()); const days=Math.min(Math.max(Number(url.searchParams.get("days")??30),1),365); const from=new Date(to.getTime()-days*86400000);
 if(!Number.isFinite(to.getTime())||!Number.isFinite(from.getTime())) return NextResponse.json({error:"invalid_date_range",requestId},{status:400});
 const usage=await getUsageSummary({organizationId:context.organizationId,from,to});
 return NextResponse.json({range:{from:from.toISOString(),to:to.toISOString()},usage,requestId},{headers:{"cache-control":"private,no-store","x-request-id":requestId}});
}
