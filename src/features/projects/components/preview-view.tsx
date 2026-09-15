"use client"

import { useState } from "react";
import { Allotment } from "allotment";
import { Loader2Icon,TerminalSquareIcon,AlertTriangleIcon,RefreshCwIcon,ExternalLinkIcon } from "lucide-react";
import { useWebContainer } from "@/features/preview/hooks/use-webcontainer";
import { PreviewSettingPopover } from "@/features/preview/components/preview-settings-popover";
import { PreviewTerminal } from "@/features/preview/components/preview-terminal";
import {Button} from "@/components/ui/button";
import { useProject } from "../hooks/use-projects";
import { Id } from "../../../../convex/_generated/dataModel";


export const PreviewView=({projectId}:{projectId:Id<"projects">})=>{
    const project=useProject(projectId);
    const [showTerminal, setShowTerminal] = useState(true);
    const {status,previewUrl,error,restart,terminalOutput}=useWebContainer({
        projectId,
        enabled:true,
        settings:project?.settings, 
    });
    const isLoading=status==="booting" || status==="installing";
    return(
        <div className="w-full h-full flex flex-col bg-background">
            <div className="h-[35px] flex items-center border-b bg-sidebar shrink-0 px-2.5">
                    <Button
                    variant="ghost"
                    size="sm"
                    disabled={isLoading}
                    onClick={restart}
                    className="size-8"
                    title="Restart Container"
                    >
                        <RefreshCwIcon className="size-3.5"/>
                    </Button>
                <div className="flex-1 h-full flex items-center px-3 bg-background border-x text-xs text-muted-foreground truncate font-mono">
                    {isLoading ? (
                        <div className="flex items-center gap-1.5">
                            <Loader2Icon className="size-3 animate-spin"/>
                            <span>{status==="booting" ? "Starting WebContainer..." : "Installing packages..."}</span>
                        </div>
                    ) : previewUrl ? (
                        <span className="truncate">{previewUrl}</span>
                    ) : error ? (
                        <span className="text-destructive truncate">Preview error</span>
                    ) : (
                        <span>Ready to preview</span>
                    )}
                </div>

                {previewUrl && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(previewUrl, "_blank")}
                        className="h-full rounded-none"
                        title="Open in new window"
                    >
                        <ExternalLinkIcon className="size-3.5" />
                        <span className="sr-only">Open in new window</span>
                    </Button>
                )}

                <Button 
                size="sm"
                variant="ghost"
                onClick={()=>setShowTerminal(!showTerminal)}
                className="h-full rounded-none"
                title="Toggle Terminal">
                    <TerminalSquareIcon className="size-3"/>
                    <span className="sr-only">Toggle Terminal</span>
                </Button>
                <PreviewSettingPopover projectId={projectId}
                initialValues={project?.settings}
                onSave={restart}
                />

            </div> 
            <div className="flex-1 min-h-0">
                <Allotment vertical>
                    <Allotment.Pane>
                        {error && (
                            <div className="size-full flex items-center justify-center text-muted-foreground p-4">
                                <div className="flex flex-col items-center gap-2 max-w-md mx-auto text-center">
                                    <AlertTriangleIcon className="size-6 text-destructive"/>
                                    <p className="text-sm font-medium">{error}</p>
                                    <Button size="sm" variant="outline" onClick={restart}>
                                        <RefreshCwIcon className="size-4 mr-1.5"/>
                                        Restart
                                    </Button>
                                </div> 
                            </div>
                        )}
                        {isLoading && !error && (
                            <div className="size-full flex items-center justify-center text-muted-foreground p-4">
                                <div className="flex flex-col items-center gap-2 max-w-md mx-auto text-center">
                                    <Loader2Icon className="size-6 animate-spin"/>
                                    <p className="text-sm font-medium">{status === "booting" ? "Booting WebContainer..." : "Installing packages..."}</p>
                                    <Button size="sm" variant="outline" onClick={restart}>
                                        <RefreshCwIcon className="size-4 mr-1.5"/>
                                        Restart
                                    </Button>
                                </div> 
                            </div>
                        )}
                        {previewUrl && (
                            <iframe 
                                src={previewUrl} 
                                className="size-full border-0" 
                                title="Preview"
                                allow="cross-origin-isolated"
                            />
                        )}
                        {!isLoading && !error && !previewUrl && (
                            <div className="size-full flex items-center justify-center text-muted-foreground p-4">
                                <div className="flex flex-col items-center gap-2 max-w-md mx-auto text-center">
                                    <p className="text-sm font-medium">No preview available</p>
                                    <p className="text-xs text-muted-foreground">Add project files (including package.json) or ask AI to create a Vite app.</p>
                                    <Button size="sm" variant="outline" onClick={restart}>
                                        <RefreshCwIcon className="size-3.5 mr-1.5"/>
                                        Start Preview
                                    </Button>
                                </div> 
                            </div>
                        )}
                    </Allotment.Pane>
                    {showTerminal && (
                        <Allotment.Pane minSize={100} maxSize={500} preferredSize={200}>
                            <div className="h-full flex flex-col bg-background border-t">
                                <div className="h-7 flex items-center px-3 text-xs gap-1.5 text-muted-foreground border-b border-border/50 shrink-0">
                                    <TerminalSquareIcon className="size-3"/>
                                    <span>Terminal</span>

                                </div>
                                <PreviewTerminal output={terminalOutput || ""}/>
                            </div>

                        </Allotment.Pane>

                    )}
                </Allotment>

            </div>

        </div>
    )
};