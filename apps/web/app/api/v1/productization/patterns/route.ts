import { NextResponse } from "next/server";
import { requirePrivileged } from "@/lib/auth/authorization";
import { createPattern } from "@/lib/productization";
import { getRequestId } from "@/lib/security/request-id";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const problem=(status:number,code:string,title:string,requestId:string)=>NextResponse.json({type:`https://tinlance.com/problems/${code}`,title,status,code,requestId},{status,headers:{"content-type":"application/problem+json","cache-control":"no-store","x-request-id":requestId}});
export async function POST(request:Request){const requestId=getRequestId(request);const auth=await requirePrivileged();if(!auth)return problem(401,"unauthorized","Authentication required",requestId);if(!auth.organizationId||!auth.userId)return problem(403,"organization_required","An active organization is required",requestId);try{const b=await request.json();const result=await createPattern({userId:auth.userId,organizationId:auth.organizationId,requestId,category:String(b.category??""),normalizedProblem:String(b.normalizedProblem??""),who:b.who,what:b.what,when:b.when,why:b.why,workaround:b.workaround,reusableParts:b.reusableParts,customerSpecificParts:b.customerSpecificParts,observationIds:Array.isArray(b.observationIds)?b.observationIds.map(String):[],m13PatternId:b.m13PatternId});return NextResponse.json(result,{status:201,headers:{"cache-control":"no-store","x-request-id":requestId}});}catch(error){const code=error instanceof Error?error.message:"m14_pattern_failed";return problem(code.includes("security")?403:code.includes("scope")||code.includes("governed")?422:400,code,"M14 pattern could not be created",requestId);}}
