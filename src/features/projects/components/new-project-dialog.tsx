"use client"
import { useEffect,useState } from "react"
import ky from "ky"
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle } from "@/components/ui/dialog";
import { PromptInput,PromptInputBody,PromptInputFooter,PromptInputHeader,PromptInputSubmit,PromptInputTextarea,PromptInputTools,type PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { Id } from "../../../../convex/_generated/dataModel";

interface NewProjectDialogProps{
    open:boolean;
    onOpenChange:(open:boolean)=>void;
};

export const NewProjectDialog = ({
    open,
    onOpenChange,
}: NewProjectDialogProps) => {
    const router = useRouter();
    const [input, setInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (message: PromptInputMessage) => {
        if (!message.text?.trim()) return;

        setIsSubmitting(true);

        try {
            const { projectId } = await ky
                .post("/api/projects/create-with-prompt", {
                    json: { prompt: message.text.trim() },
                })
                .json<{ projectId: Id<"projects"> }>();

            toast.success("Project created successfully");

            onOpenChange(false);
            setInput("");

            router.push(`/projects/${projectId}`);
        } catch (error) {
            console.error("Failed to create project:", error);
            toast.error("Failed to create project");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg p-0" showCloseButton={false}>
                <DialogHeader className="hidden">
                    <DialogTitle>What do you want to build</DialogTitle>
                    <DialogDescription>
                        Create a new project with a description.
                    </DialogDescription>
                    </DialogHeader> 
                    <PromptInput
                        className="border-none!"
                        onSubmit={handleSubmit}
                     
                    >
                        <PromptInputHeader />
                        <PromptInputBody >
                            <PromptInputTextarea
                                placeholder="What would you like to build today?"
                               onChange={(e)=>setInput(e.target.value)}
                               value={input}
                               disabled={isSubmitting }
                            />
                        </PromptInputBody>
                        <PromptInputFooter>
                            <PromptInputTools />
                            <PromptInputSubmit disabled={!input ||isSubmitting} />
                        </PromptInputFooter>
                    </PromptInput>
                </DialogContent>

          
        </Dialog>
    );
};