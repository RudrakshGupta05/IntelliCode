import { ChevronRightIcon, FilePlusCornerIcon, FolderPlusIcon } from "lucide-react";
import { FileIcon, FolderIcon } from "@react-symbols/icons/utils";
import { cn } from "@/lib/utils";
import { useCreateFolder, useCreateFile, useFolderContents } from "../../hooks/use-files";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Doc } from "../../../../../convex/_generated/dataModel";
import { getItemPadding } from "./constants";
import { LoadingRow } from "./loading-row";
import { CreateInput } from "./create-input";
import { useState } from "react";
import { useRenameFile, useDeleteFile } from "../../hooks/use-files";
import { TreeItemWrapper } from "./tree-item-wrapper"; 
import { RenameInput } from "./rename-input";
import { useEditor } from "@/features/editor/hooks/use-editor";
import { Button } from "@/components/ui/button";

export const Tree=({
item,level=0,projectId,
}:{
    item:Doc<"files">;
    level?:number;
    projectId:Id<"projects">;
    

})=>{
    const [isOpen,setIsOpen] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [creating, setCreating] = useState<"file" | "folder" |null>(null);

    const rename=useRenameFile();
    const deleteFile=useDeleteFile();
    const createFolder=useCreateFolder();
    const createFile=useCreateFile();
    const {openFile,closeTab,activeTabId}=useEditor(projectId);
    const folderContents=useFolderContents({projectId,parentId:item._id,enabled: item.type==="folder" && isOpen});

  
    const handleRename=(newName:string)=>{
        setIsRenaming(false);
        if(newName===item.name){
            return;
        }
        rename({id:item._id,newName});
    }
    const handleCreate=(name:string)=>{
        setCreating(null);
        if(creating==="file"){
            createFile({
                projectId,
                content:"",
                name,parentId:item._id
            })
        }
        else if(creating==="folder"){
            createFolder({projectId,parentId:item._id,name});
        } 
    }
      const startCreating =(type: "file" | "folder") => {
        setIsOpen (true);
        setCreating(type);
    };


    if(item.type==="file"){
        const fileName=item.name;
        const isActive=activeTabId===item._id; 
        if(isRenaming){
            return (
                <RenameInput type="file"
                defaultValue={fileName}
                level={level}
                onSubmit={handleRename}
                onCancel={()=>setIsRenaming(false)}/>
            )
        }
        return (
           <TreeItemWrapper 
           item={item}
           level={level}
           isActive={isActive}
           onClick={() => openFile(item._id,{pinned:false})}
           onDoubleClick={() => openFile(item._id,{pinned:true})}
           onRename={() => setIsRenaming (true) }
           onDelete={()=>{closeTab(item._id);deleteFile({id:item._id})}}>
            <FileIcon fileName={fileName} autoAssign className="size-4"/>
            <span className="truncate text-sm">{fileName}</span>
           </TreeItemWrapper>
        )
    } 
    const folderName=item.name;
    const folderRender=(
        <>
        <div className="flex items-center gap-0.5">
            <ChevronRightIcon className={cn("size-4 shrink-0 text-muted-foreground", isOpen && "rotate-90" )}/>
            <FolderIcon folderName={folderName} className="size-4"/>
        </div>
        <span className="truncate text-sm">{folderName}</span>
        </>
    )
    if(creating){
        return (
            <>
            <button onClick={()=>setIsOpen((value)=>!value)}
                className="group flex items-center gap-1 h-5.5 
                hover:bg-accent/30 w-full "
                style={{paddingLeft:getItemPadding(level,false )}}>
                    {folderRender}
                </button>
                {isOpen && (
                    <>
                    {folderContents=== undefined && <LoadingRow level={level+1}/>}
                    <CreateInput type={creating}
                    level={level+1}
                    onSubmit={handleCreate}
                    onCancel={()=> setCreating(null)}/>
                    {folderContents?.map((subItem)=>(<Tree
                     key={subItem._id}
                     item={ subItem}
                     level={level + 1} projectId={projectId}   />  
                    ))}
                    </>
                )}
            </>
        )
    }
     if(isRenaming){
        return (
            <>
            <RenameInput type="folder" defaultValue={folderName} level={level} onSubmit={handleRename} onCancel={()=> setIsRenaming(false)} isOpen={isOpen} />
                {isOpen && (
                    <>
                    {folderContents=== undefined && <LoadingRow level={level+1}/>}
                    
                    {folderContents?.map((subItem)=>(<Tree
                     key={subItem._id}
                     item={ subItem}
                     level={level + 1} projectId={projectId}   />  
                    ))}
                    </>
                )}
            </>
        )
    }
    return (

       <>
       <TreeItemWrapper 
       item={item}
       level={level}
       onClick={()=>setIsOpen((value)=>!value)}
       onDoubleClick={()=>{}}
       onRename={()=>setIsRenaming(true)}
       onDelete={()=>deleteFile({id:item._id})}
       onCreateFile={()=>startCreating("file")}
       onCreateFolder={()=>startCreating("folder")}>
            {folderRender}
            <div className="opacity-0 group-hover:opacity-100 transition-none duration-0 flex items-center gap-0.5 ml-auto mr-1">
                <Button onClick={(e)=>{
                    e.stopPropagation();
                    e.preventDefault();
                    startCreating("file");
                }} variant="highlight" size="icon-xs" title="New File">
                    <FilePlusCornerIcon className="size-3.5"/>
                </Button>
                <Button onClick={(e)=>{
                    e.stopPropagation();
                    e.preventDefault();
                    startCreating("folder");
                }} variant="highlight" size="icon-xs" title="New Folder">
                    <FolderPlusIcon className="size-3.5"/>
                </Button>
            </div>
        </TreeItemWrapper>
        {isOpen && (
            <>
            {folderContents=== undefined && <LoadingRow level={level+1} />}
       {folderContents?.map((subItem) => (
       <Tree
       key={subItem._id}
       item={ subItem}
       level={level + 1} projectId={projectId}   />  
      ))}


            </>
        )}
       </>
    )

 
}