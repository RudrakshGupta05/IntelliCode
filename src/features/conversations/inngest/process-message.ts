import { NonRetriableError } from "inngest";
import { Id } from "../../../../convex/_generated/dataModel"
import { inngest } from "@/inngest/client";
import { api } from "../../../../convex/_generated/api";
import { convex } from "@/lib/convex-client";
import { CODING_AGENT_SYSTEM_PROMPT, TITLE_GENERATOR_SYSTEM_PROMPT } from "./constants";
import { DEFAULT_CONVERSATION_TITLE } from "../constants";
import {createAgent,createNetwork,openai,Tool} from '@inngest/agent-kit'
import { createReadFilesTool } from "./tools/read-files";
import { createListFilesTool } from "./tools/list-files";
import { createUpdateFileTool } from "./tools/update-file";
import { createCreateFileTool } from "./tools/create-files";
import { createCreateFolderTool } from "./tools/create-folder";
import { createRenameFileTool } from "./tools/rename-file";
import { createDeleteFilesTool } from "./tools/delete-files";
import { createScrapeUrlsTool } from "./tools/scrape-urls";

interface MessageEvent{
    messageId:Id<"messages">;
    conversationId:Id<"conversations">;
    projectId:Id<"projects">;
    message:string;
    

}
export const processMessage = inngest.createFunction(
    {
        id: "process-message",
        triggers: [{ event: "message/sent" }],
        cancelOn: [{
            event: "message/cancel",
            if: "event.data.messageId == async.data.messageId",
        }],
        onFailure: async ({ event, step }) => {
            const { messageId } = event.data.event.data as MessageEvent;
            const internalKey = process.env.CONVEX_INTERNAL_KEY;
            if (internalKey) {
                await step.run("update-message-on-failure", async () => {
                    await convex.mutation(api.system.updateMessageContent, {
                        internalKey,
                        messageId,
                        content: "AI could not process this message"
                    })
                });
            }
        }
    },
    async ({ event, step }) => {
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
        await step.sleep("wait-for-db-sync","1s");
        const conversation=await step.run("get-conversation-by-id",async()=>{
            return await convex.query(api.system.getConversationById,{
                internalKey,
                conversationId,
            });
        });
        if(!conversation){
            throw new NonRetriableError("conversation not found");
        }

        const recentMessages= await step.run("get-recent-messages",async()=>{
            return await convex.query(api.system.getRecentMessages,{
                internalKey,
                conversationId,
                limit:10,
            });
        });
let systemPrompt = CODING_AGENT_SYSTEM_PROMPT;

const contextMessages = recentMessages.filter(
    (msg) => msg._id !== messageId && msg.content.trim() !== ""
);

if (contextMessages.length > 0) {
    const historyText = contextMessages
        .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join("\n\n");

    systemPrompt = `${CODING_AGENT_SYSTEM_PROMPT}

## Previous Conversation (for context only - do NOT repeat these responses):
${historyText}

## Current Request:
Respond ONLY to the user's new message below. Do not repeat or reference your previous responses.
`;
}
        const shouldGeneratitle =
            !conversation.title || conversation.title.trim() === DEFAULT_CONVERSATION_TITLE;
        if (shouldGeneratitle) {
            await step.run("generate-and-update-title", async () => {
                const titleAgent = createAgent({
                    name: "title-generator",
                    system: TITLE_GENERATOR_SYSTEM_PROMPT,
                    model: openai({
                        model: "qwen/qwen3.8-27b",
                        baseUrl: "https://api.groq.com/openai/v1",
                        apiKey: process.env.GROQ_API_KEY!,
                    }),
                });
                let title = "";
                try {
                    const { output } = await titleAgent.run(message);
                    const textMessage = output.find(
                        (m) => m.type === "text" && m.role === "assistant"
                    );
                    if (textMessage?.type === "text") {
                        title = typeof textMessage.content === "string" 
                            ? textMessage.content.trim() 
                            : textMessage.content.map((c) => c.text).join("").trim();
                    }
                } catch (err) {
                    console.error("Title generator AI error:", err);
                }

                // Fallback to simple snippet title if AI generation failed
                if (!title) {
                    title = message.trim().slice(0, 30);
                    if (message.length > 30) title += "...";
                }

                if (title) {
                    await convex.mutation(api.system.updateConversationTitle, {
                        internalKey,
                        conversationId,
                        title,
                    });
                }
            });
        }
        const codingAgent = createAgent({
            name: "intellicode",
            description:"An expert AI coding assistant that helps developers plan,write,test,debug,and optimize code across multiple languages and frameworks.It provides code completions,bug fixes,performance improvements,and refactoring suggestions while maintaining project context and adhering to coding best practices",
            system:systemPrompt,
            model: openai({
                        model: "qwen/qwen3.8-27b",
                        baseUrl: "https://api.groq.com/openai/v1",
                        apiKey: process.env.GROQ_API_KEY!,
                    }),
            tools:[
                createListFilesTool({internalKey,projectId}),
                createReadFilesTool({internalKey}),
                createUpdateFileTool({internalKey}),
                createCreateFileTool({projectId,internalKey}),
                createCreateFolderTool({projectId,internalKey}),
                createRenameFileTool({internalKey}),
                createDeleteFilesTool({internalKey}),
                createScrapeUrlsTool()
                
            
            ]
        });
        const network=createNetwork({
            name:"IntelliCode-network",
            agents:[codingAgent],
            maxIter:10,
            router:({network})=>{
                const lastResult=network.state.results.at(-1);
                
                // If it's the first iteration (no previous results), run the codingAgent
                if (!lastResult) {
                    return codingAgent;
                }

                // If the last result had tool calls, run the codingAgent again
                const hasToolCalls=lastResult.output.some(
                    (m)=>m.type==="tool_call"
                );
                if (hasToolCalls) {
                    return codingAgent;
                }
                
                // Otherwise stop the network
                return undefined;
            },
        });
        const result=await network.run(message);
        const lastResult=result.state.results.at(-1);
        const textMessage=lastResult?.output.find(
            (m)=>m.type==="text"
        );
        let assistantResponse="I processed your request.Let me know if you need anything else";
        if(textMessage?.type==="text"){
            assistantResponse=typeof textMessage.content ==="string"
            ? textMessage.content:textMessage.content.map((c)=>c.text).join("");
        }

        await step.run("updated-assistant-message",async()=>{
            await convex.mutation(api.system.updateMessageContent,{
                internalKey,
                messageId,
                content:assistantResponse,
            })
        });
        return {success:true,messageId,conversationId}
    }
  );
  