import { Id } from "../../../../convex/_generated/dataModel";
import { Conversation,ConversationContent,ConversationScrollButton } from "@/components/ai-elements/conversation";
import {Message,MessageContent,MessageResponse,MessageActions,MessageAction}from "@/components/ai-elements/message";
import { PromptInput,PromptInputBody,PromptInputFooter,PromptInputSubmit,PromptInputTextarea ,PromptInputTools,type PromptInputMessage} from "@/components/ai-elements/prompt-input";
import ky from "ky";
import {toast} from "sonner";
import React,{useState,useRef} from "react";
import { CopyIcon,HistoryIcon,LoaderIcon,PlusIcon,RocketIcon,WrenchIcon,Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConversation,useCreateConversation,useMessages,useConversations } from "../hooks/use-conversations";
import { PastConversationsDialog } from "./past-conversations-dialog";
import { DEFAULT_CONVERSATION_TITLE } from "../constants";

interface ConversationSidebarProps{
    projectId:Id<"projects">;
};

export const ConversationSidebar=({projectId}:ConversationSidebarProps)=>{
    const [selectedConversationId,setSelectedConversationId]=useState<Id<"conversations">|null>(null);


    const [pastConversationsOpen, setPastConversationsOpen] = useState(false);
    const createConversation=useCreateConversation();
    const conversations=useConversations(projectId);
    const [input,setInput]=useState("");
    const activeConversationId=selectedConversationId??conversations?.[0]?._id??null;

    const [pastConversationsOpen, setPastConversationsOpen] = useState(false)
     const createConversation=useCreateConversation();
     const conversations=useConversations(projectId);
     const [input,setInput]=useState("");
     const activeConversationId=selectedConversationId??conversations?.[0]?._id??null;

    const activeConversation=useConversation(activeConversationId);
    const conversationMessages=useMessages(activeConversationId);
    const isProcessing=conversationMessages?.some(
        (msg)=>msg.status==="processing"

    );

    )

    
    const handleCancel=async()=>{
        try{
            await ky.post("/api/messages/cancel",{
                json:{

                    projectId,
                }
            });
        }
        catch{
            toast.error("Failed to cancel messages");
        }
    };

    const handleCreateConversation=async()=>{

                    projectId,                }
            })
        }
        catch{
            toast.error("Failed to cancel messages")
        }
    }
     const handleCreateConversation=async()=>{

        try{
            const newConversationId=await createConversation({
                projectId,
                title:DEFAULT_CONVERSATION_TITLE,
            });
            setSelectedConversationId(newConversationId);
            return newConversationId;
        }
        catch{
            toast.error("Failed to create conversation");
            return null;
        }

    };

    const handleSubmit=async (message:PromptInputMessage)=>{
        const text = (message.text || input).trim();
        if(isProcessing && !text){
            await handleCancel();
            setInput("");
            return;
        }
        if(!text){
            return;
        }

        // Clear input immediately for snappy, instantaneous user response
        setInput("");

        let conversationId=activeConversationId;

     }
const handleSubmit=async (message:PromptInputMessage)=>{


    if(isProcessing && !message.text){
        await handleCancel();
        setInput("")
        return;
    }
    let conversationId=activeConversationId;
     if(!conversationId){
        conversationId=await handleCreateConversation()

        if(!conversationId){
            conversationId=await handleCreateConversation();
            if(!conversationId){
                return; 
            }
        }

        try{
            await ky.post("/api/messages",{json:{
                conversationId,
                message: text,
            }});
        }
        catch{
            toast.error("Message failed to send");
        }
    };

    const handleQuickAction = (actionText: string, autoSubmit = false) => {
        if (autoSubmit) {
            handleSubmit({ text: actionText, files: [] });
        } else {
            setInput(actionText);
        }
    };

    return (
    <>
    <PastConversationsDialog projectId={projectId} open={pastConversationsOpen} onOpenChange={setPastConversationsOpen} onSelect={setSelectedConversationId} />
    

    <div className="flex flex-col h-full bg-sidebar ">
        <div className="h-[35px] flex items-center justify-between border-b">

}
    catch{
        toast.error("Message failed to send")
    }
    setInput(""); 
}
    return (
    <>
    <PastConversationsDialog projectId={projectId} open={pastConversationsOpen} onOpenChange={setPastConversationsOpen} onSelect={setSelectedConversationId} />
    
    <div className="flex flex-col h-full bg-sidebar ">
        <div className="h-8.75 flex items-center justify-between border-b">

            <div className="text-sm truncate pl-3">
                {activeConversation?.title??DEFAULT_CONVERSATION_TITLE}
            </div>
            <div className="flex items-center px-1 gap-1">

                <Button size="icon-xs" variant="highlight" onClick={()=>setPastConversationsOpen(true)} title="Past Conversations">

                <Button size="icon-xs" variant="highlight" onClick={()=>setPastConversationsOpen(true)}>

                    <HistoryIcon className="size-3.5"/> 
                </Button>
                <Button size="icon-xs" variant="highlight" onClick={handleCreateConversation} title="New Conversation">
                    <PlusIcon className="size-3.5"/> 
                </Button>
            </div>
        </div>
        <Conversation className="flex-1">
            <ConversationContent>
                {(!conversationMessages || conversationMessages.length === 0) && (
                    <div className="flex flex-col items-center justify-center p-4 text-center text-muted-foreground gap-3 my-auto">
                        <p className="text-xs">Quick Start with IntelliCode</p>
                        <div className="flex flex-col gap-2 w-full">
                            <button
                                onClick={() => handleQuickAction("Create a complete Vite React app with a beautiful UI, package.json, and preview setup", true)}
                                className="flex items-center gap-2 p-2 rounded-md bg-background/50 hover:bg-accent text-xs text-left border transition-colors cursor-pointer"
                            >
                                <RocketIcon className="size-3.5 text-blue-500 shrink-0"/>
                                <span>Create Vite React App</span>
                            </button>
                            <button
                                onClick={() => handleQuickAction("Apply changes to: ", false)}
                                className="flex items-center gap-2 p-2 rounded-md bg-background/50 hover:bg-accent text-xs text-left border transition-colors cursor-pointer"
                            >
                                <WrenchIcon className="size-3.5 text-emerald-500 shrink-0"/>
                                <span>Apply changes to file</span>
                            </button>
                            <button
                                onClick={() => handleQuickAction("Delete the following files: ", false)}
                                className="flex items-center gap-2 p-2 rounded-md bg-background/50 hover:bg-accent text-xs text-left border transition-colors cursor-pointer"
                            >
                                <Trash2Icon className="size-3.5 text-rose-500 shrink-0"/>
                                <span>Delete files / folder</span>
                            </button>
                        </div>
                    </div>
                )}
                {conversationMessages?.map((message,messageIndex)=>(
                    <Message key={message._id} 
                    from={message.role}>
                        <MessageContent>
             {message.status==="processing"?(
    <div className="flex items-center gap-2 text-muted-foreground">
        <LoaderIcon className="size-4 animate-spin"/>
        <span >Thinking...</span>
    </div>):message.status==="cancelled"?(
        <span className="text-muted-foreground italic">
            Request cancelled
        </span>

    ):(<MessageResponse>
        {message.content}
    </MessageResponse>)}
                        </MessageContent>
                        {message.role ==="assistant" && message.status==="completed" && messageIndex===(conversationMessages?.length??0)-1 && (
                            <MessageActions>
                                <MessageAction onClick={()=>{navigator.clipboard.writeText(message.content)}}
                                    label="copy">
                                    <CopyIcon className="size-3.5"/>
                                </MessageAction>
                                </MessageActions> 
                        )}

                    </Message>
                ))}
            </ConversationContent>
            <ConversationScrollButton/>

        </Conversation>
        <div className="p-3">
            <PromptInput onSubmit={handleSubmit} className="mt-2 rounded-full">
                <PromptInputBody>
                    <PromptInputTextarea 
                        placeholder="Ask IntelliCode..." 
                        onChange={(e)=>setInput(e.target.value)} 
                        value={input} 
                        disabled={isProcessing}
                    />
                </PromptInputBody>
                <PromptInputFooter>
                    <PromptInputTools/>
                    <PromptInputSubmit disabled={isProcessing?false:!input.trim()} status={isProcessing?"streaming":undefined}/>
                </PromptInputFooter>
            </PromptInput>
        </div>
    </div>
    </>
    );
};