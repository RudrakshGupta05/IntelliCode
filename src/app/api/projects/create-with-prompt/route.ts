import z from "zod";
import { NextResponse } from "next/server";
import {auth} from "@clerk/nextjs/server";
import { inngest } from "@/inngest/client";
import { convex } from "@/lib/convex-client";
import { adjectives,animals,colors,uniqueNamesGenerator } from "unique-names-generator";
import { api } from "../../../../../convex/_generated/api";
import { DEFAULT_CONVERSATION_TITLE } from "@/features/conversations/constants";


const requestSchema=z.object({
   prompt:z.string().min(1,"prompt is required"),
   
   
}) ;

export async function POST(request:Request){
    const {userId}=await auth();
    if(!userId){
        return NextResponse.json({error:"Unauthorized"},{status:401})
    };
    const internalKey=process.env.CONVEX_INTERNAL_KEY;
    if(!internalKey){
        return NextResponse.json({error:"Internal key is not configured"},{status:500})
    };


    const body=await request.json();
    const {prompt}=requestSchema.parse(body);
    const projectName=uniqueNamesGenerator({
        dictionaries:[adjectives,animals,colors],
        style:"lowerCase",
        separator:"-",
        length:3,
        
    });
    const {projectId,conversationId}=await convex.mutation(api.system.createProjectWithConversation,{
        internalKey,
        projectName,
        conversationTitle:DEFAULT_CONVERSATION_TITLE,
        ownerId:userId,
    });

await convex.mutation(api.system.createMessage,{
    internalKey,
    conversationId,
    projectId,
    role:"user",
    content:prompt,
    status:"completed",  // ← line 51 - already there
});

const assistantMessageId=await convex.mutation(api.system.createMessage,{
    internalKey,
    conversationId,
    projectId,
    role:"assistant",
    content:"Initializing new project...",
    status:"processing",
}); 

await inngest.send({
    name:"message/sent",
    data:{
       
        projectId,
        conversationId,
        messageId:assistantMessageId,
        message:prompt,
    }
});

return NextResponse.json({projectId})    

}; 