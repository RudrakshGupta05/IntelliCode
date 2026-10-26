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
            const { messageId,conversationId,projectId,message } = event.data.event.data as MessageEvent;
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
        // Immediately query conversation and recent messages without unnecessary sleep delay
        const conversation = await step.run("get-conversation-by-id", async () => {
            return await convex.query(api.system.getConversationById, {
                internalKey,
                conversationId,
            });
        });
        if (!conversation) {
            throw new NonRetriableError("conversation not found");
        }

        const recentMessages = await step.run("get-recent-messages", async () => {
            return await convex.query(api.system.getRecentMessages, {
                internalKey,
                conversationId,
                limit: 10,
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

## Previous Conversation:
${historyText}

## Current Request:
Respond directly and concisely to the user's new message below.
`;
        }

        const codingAgent = createAgent({
            name: "intellicode",
            description: "An expert AI coding assistant that helps developers plan, write, test, debug, and optimize code across multiple languages and frameworks.",
            system: systemPrompt,
            model: openai({
                model: "openai/gpt-oss-120b",
                baseUrl: "https://api.groq.com/openai/v1",
                apiKey: process.env.GROQ_API_KEY!,
            }),
            tools: [
                createListFilesTool({ internalKey, projectId }),
                createReadFilesTool({ internalKey, projectId }),
                createUpdateFileTool({ internalKey, projectId }),
                createCreateFileTool({ projectId, internalKey }),
                createCreateFolderTool({ projectId, internalKey }),
                createRenameFileTool({ internalKey }),
                createDeleteFilesTool({ internalKey, projectId }),
                createScrapeUrlsTool()
            ]
        });

        const network = createNetwork({
            name: "IntelliCode-network",
            agents: [codingAgent],
            maxIter: 8,
            router: ({ network }) => {
                const lastResult = network.state.results.at(-1);
                if (!lastResult) {
                    return codingAgent;
                }
                const hasToolCalls = lastResult.output.some(
                    (m) => m.type === "tool_call"
                );
                if (hasToolCalls) {
                    return codingAgent;
                }
                return undefined;
            },
        });

        const result = await network.run(message);
        const lastResult = result.state.results.at(-1);
        const textMessage = lastResult?.output.find(
            (m) => m.type === "text"
        );
        let assistantResponse = "I processed your request. Let me know if you need anything else!";
        if (textMessage?.type === "text") {
            assistantResponse = typeof textMessage.content === "string"
                ? textMessage.content
                : textMessage.content.map((c) => c.text).join("");
        }

        // Deliver assistant response to the user as fast as possible
        await step.run("updated-assistant-message", async () => {
            await convex.mutation(api.system.updateMessageContent, {
                internalKey,
                messageId,
                content: assistantResponse,
            });
        });

        // Generate conversation title in the background without blocking the response
        const shouldGenerateTitle =
            !conversation.title || conversation.title.trim() === DEFAULT_CONVERSATION_TITLE;
        if (shouldGenerateTitle) {
            await step.run("generate-and-update-title", async () => {
                const titleAgent = createAgent({
                    name: "title-generator",
                    system: TITLE_GENERATOR_SYSTEM_PROMPT,
                    model: openai({
                        model: "openai/gpt-oss-120b",
                        baseUrl: "https://api.groq.com/openai/v1",
                        apiKey: process.env.GROQ_API_KEY!,
                    }),
                });
                let title = "";
                try {
                    const { output } = await titleAgent.run(message);
                    const titleTextMessage = output.find(
                        (m) => m.type === "text" && m.role === "assistant"
                    );
                    if (titleTextMessage?.type === "text") {
                        title = typeof titleTextMessage.content === "string" 
                            ? titleTextMessage.content.trim() 
                            : titleTextMessage.content.map((c) => c.text).join("").trim();
                    }
                } catch (err) {
                    console.error("Title generator AI error:", err);
                }

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

        return { success: true, messageId, conversationId };
    }
  );
  