import {z} from "zod";
import {NextRequest,NextResponse} from "next/server";

import {auth,clerkClient} from "@clerk/nextjs/server";
import { inngest } from "@/inngest/client";
import { Id } from "../../../../../convex/_generated/dataModel";


const requestSchema=z.object({
    projectId:z.string(),
    repoName:z.string().min(1).max(100),
    visibility:z.enum(['private','public']).default('private'),
    description: z.string().max(500).optional(),

});
export async function POST(request:Request){
    const {userId}=await auth();
    if(!userId){
        return NextResponse.json({error:"Unauthorized"},{status:401})
    }
    const body=await request.json();
    const {projectId,repoName,visibility,description}=requestSchema.parse(body);
 

    const client=await clerkClient();
    const tokens=await client.users.getUserOauthAccessToken(userId,'github');
    const githubToken=tokens.data[0]?.token;
    if(!githubToken){
        return NextResponse.json({error:"Github not connected. Please reconnect"},{status:400});
    };
    
      const internalKey=process.env.CONVEX_INTERNAL_KEY;
      if(!internalKey){
          return NextResponse.json({error:"server error"},{status:500})
      }
      
      const event=await inngest.send({
        name:"github/export.repo",
        data:{
            projectId,
            repoName,
            visibility,
            description,
            githubToken,
            internalKey,
        }
    });
      
   

    return NextResponse.json({success:true,projectId,eventId:event.ids[0]});
};

