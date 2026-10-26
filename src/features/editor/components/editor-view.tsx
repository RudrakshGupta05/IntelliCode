import { Id } from "../../../../convex/_generated/dataModel";
import { useEditor } from "../hooks/use-editor";
import TopNavigation from "./top-navigation";
import { FileBreadcrumbs } from "./file-breadcrumbs";
import Image from "next/image";
import { useFile, useUpdateFile } from "@/features/projects/hooks/use-files";
import { CodeEditor } from "./code-editor";
import { useEffect, useRef } from "react";
import { AlertTriangleIcon } from "lucide-react";


export const EditorView=({projectId}: {projectId: Id<"projects">})=>{
  const {activeTabId}=useEditor(projectId);
  const activeFile = useFile(activeTabId);
  const updateFile=useUpdateFile();
  const timeoutRef=useRef<NodeJS.Timeout | null>(null);
  const isActiveFileBinary=activeFile&& activeFile.storageId;
  const isActiveFileText=activeFile&& !activeFile.storageId;

  useEffect(()=>{
    return ()=>{
        if(timeoutRef.current){
            clearTimeout(timeoutRef.current);
        }
    }
  },[activeTabId])

    return (
        <div className="h-full flex flex-col ">
            <div className="flex items-center">
                <TopNavigation projectId={projectId}/>
            </div>
            {activeTabId && <FileBreadcrumbs projectId={projectId}/>}
            <div className="flex-1 min-h-0 bg-background">
                {!activeFile && (
                    <div className="flex items-center justify-center size-full">
                        <Image src="/logo.svg" alt="IntelliCode" width={50} height={50} className="opacity-1"/>
                    </div>
                ) }
                {isActiveFileText && (
                    <CodeEditor fileName={activeFile.name} key={activeFile._id}
                    initialValue={activeFile?.content}
                    onChange={(content:string)=>{
                        if(timeoutRef.current){
                            clearTimeout(timeoutRef.current);
                        }
                        timeoutRef.current=setTimeout(()=>{
                            updateFile({
                                id:activeFile._id,
                                content,
                            })
                        },1500);
                    }} />
                )}
                {isActiveFileBinary && (
                    <div className="size-full flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2.5 max-w-md text-center">
                            <AlertTriangleIcon className="size-10 text-yellow-500"/>
                            <h2 className="text-sm font-medium">Binary files are not supported yet.</h2>
                            <p className="text-xs text-muted-foreground">{activeFile.name} will be editable in a future update.</p>
                        </div>
                    </div>
                )}


            </div>
        </div>
    )

} 