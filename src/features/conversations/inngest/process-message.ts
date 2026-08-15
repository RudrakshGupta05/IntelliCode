import { NonRetriableError } from "inngest";
import { Id } from "../../../../convex/_generated/dataModel"
import { inngest } from "@/inngest/client";
import { api } from "../../../../convex/_generated/api";
import { convex } from "@/lib/convex-client";
interface MessageEvent{
    messageId:Id<"messages">;
    conversationId:Id<"conversations">;
    projectId:Id<"projects">;
    message:string;
    

}
  export const processMessage = inngest.createFunction(
    {
        id:"process-message",
        cancelOn:[{
            event:"message/cancel",
            if:"event.data.messageId === async.data.messageId",
            
        }],
        onFailure:async({event,step})=>{
           const {messageId}=event.data.event.data as MessageEvent;
           const internalKey=process.env.CONVEX_INTERNAL_KEY;
         if(internalKey){
            await step.run("update-message-on-failure",async()=>{
            await convex.mutation(api.system.updateMessageContent,{
                internalKey,
                messageId,
                content:"AI could not process this message"
            })
        });
            
         }
        }
    },
    {
        event:"message/sent "
    },
    async ({event,step})=>{
        const{
            messageId,
            conversationId,
            projectId,
            message,
        }=event.data as MessageEvent;
        const internalKey=process.env.CONVEX_INTERNAL_KEY;
        if(!internalKey){
            throw new NonRetriableError("CONVEX_INTERNAL_KEY not set");
        }
        await step.sleep("wait-for-ai-response","5s");
        await step.run("updated-assistant-message",async()=>{
            await convex.mutation(api.system.updateMessageContent,{
                internalKey,
                messageId,
                content:"AI processed this message"
            })
        });

    }
  );
  