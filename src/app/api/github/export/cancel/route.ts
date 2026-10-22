import {z} from "zod";
import {NextRequest,NextResponse} from "next/server";

import {auth} from "@clerk/nextjs/server";
import { convex } from "@/lib/convex-client";
import { inngest } from "@/inngest/client";

import { Id } from "../../../../../../convex/_generated/dataModel";

import { api } from "../../../../../../convex/_generated/api";
const requestSchema = z.object({
   projectId:z.string(),
});
  

export async function POST(request:Request) {
    const {userId}=await auth();
    if(!userId){
        return NextResponse.json({error:"Unauthorized"},{status:401});
    };
    const body=await request.json();
    const {projectId}=requestSchema.parse(body); 
    

    
      const internalKey=process.env.CONVEX_INTERNAL_KEY;
      if(!internalKey){
          return NextResponse.json({error:"server error"},{status:500})
      } 
    
    await inngest.send({
        name:"github/export.cancel",
        data:{
            projectId
        }
    });

    await convex.mutation(api.system.updateExportStatus,{
        internalKey,
        projectId:projectId as Id<"projects">,
        status:"cancelled",
    })

    return NextResponse.json({success:true,projectId,});
      

}



