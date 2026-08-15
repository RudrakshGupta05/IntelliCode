import {z} from "zod"
import { NextResponse } from "next/server";
import { Id } from "../../../../convex/_generated/dataModel";
import {api} from "../../../../convex/_generated/api";
import {auth} from "@clerk/nextjs/server";
import {convex} from "@/lib/convex-client";
import { inngest } from "@/inngest/client";

const requestSchema=z.object({
    conversationId:z.string(),
    message:z.string()
});

export async function POST(request:Request){
    const {userId}=await auth();
    if(!userId){
        return NextResponse.json({error:"Unauthorized"},{status:401})
    }
    const internalKey=process.env.CONVEX_INTERNAL_KEY;
    if(!internalKey){
        console.error("CONVEX_INTERNAL_KEY not set");
        return NextResponse.json({error:"Internal server error"},{status:500})
    }
    const body=await request.json();
    const {conversationId,message}=requestSchema.parse(body);
    const conversation=await convex.query(api.system.getConversationById,{
        internalKey,
        conversationId:conversationId as Id<"conversations">,

    });
    if(!conversation){
        return NextResponse.json({error:"Conversation not found"},{status:404})
    }
    const projectId=conversation.projectId;
    await convex.mutation(api.system.createMessage,{
        internalKey,
        conversationId:conversationId as Id<"conversations">,
        projectId:projectId as Id<"projects">,
        content:message,
        role:"user",
        status:"completed"
       
    });
    const assistantMessageId=await convex.mutation(api.system.createMessage,{
        internalKey,
        conversationId:conversationId as Id<"conversations">,
        projectId:projectId as Id<"projects">,
        content:"Assistant is thinking...",
        role:"assistant",
       status:"processing", 
    

    });
    const event=await inngest.send({
        name:"message/sent",
        data:{
            messageId:assistantMessageId,
            
        },
    })
    return NextResponse.json({
        success:true,
        eventId:event.ids[0],
        messageId:assistantMessageId,
        
    })
}
      