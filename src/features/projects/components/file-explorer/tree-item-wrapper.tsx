import { cn } from "@/lib/utils";
import { ContextMenu } from "@/components/ui/context-menu";
import { ContextMenuContent } from "@/components/ui/context-menu";
import { ContextMenuItem } from "@/components/ui/context-menu";
import { ContextMenuTrigger , ContextMenuSeparator,ContextMenuShortcut} from "@/components/ui/context-menu";

import { Id } from "../../../../../convex/_generated/dataModel";
import { File, Folder, Plus, Trash2 } from "lucide-react";

import { Doc } from "../../../../../convex/_generated/dataModel";
import { getItemPadding } from "./constants";


export const TreeItemWrapper=({item,children,level,isActive,onClick,onDoubleClick,
    onRename,onDelete,onCreateFile,onCreateFolder,
}:{
    item: Doc<"files">;
    children: React.ReactNode;
    level: number;
    isActive?: boolean;
    onClick?: () => void;
    onDoubleClick?: () => void;
    onRename: (id: Id<"files">) => void;
    onDelete: (id: Id<"files">) => void;
    onCreateFile?: (id: Id<"files">) => void;
    onCreateFolder?: (id: Id<"files">) => void;
    }) => {
        return (
            <ContextMenu>
                <ContextMenuTrigger asChild>
                <button onClick={onClick}
                onDoubleClick={onDoubleClick}
                onKeyDown={(e)=>{
                    if(e.key==="Enter"){
                        e.preventDefault();
                        onRename?.(item._id);
                    }}}
                className={cn("group flex items-center gap-1 w-full h-5.5 hover: bg-accent/30 outline-none focus:ring-1 focus:ring-inset focus:ring-ring",isActive && "bg-accent/30")}
                style={{paddingLeft:getItemPadding(level,item.type==="file")}}    
                >
                    {children}
                </button>
                </ContextMenuTrigger>
                <ContextMenuContent onCloseAutoFocus={(e)=>e.preventDefault()} className="w-64">
                   {item.type==="folder" && (
                    <>
                    <ContextMenuItem onClick={()=>onCreateFile?.(item._id)}
                    className="text-sm">
                    New File...
                    </ContextMenuItem>

                    <ContextMenuItem onClick={()=>onCreateFolder?.(item._id)}
                    className="text-sm">
                    New Folder...
                    </ContextMenuItem>
                    <ContextMenuSeparator>
                        
                    </ContextMenuSeparator>
                    </>
                   )}
                   <ContextMenuItem onClick={()=>onRename(item._id)}
                   className="text-sm">
                    Rename...
                    <ContextMenuShortcut>Enter</ContextMenuShortcut>
                   </ContextMenuItem>
                   <ContextMenuItem onClick={()=>onDelete(item._id)}
                   className="text-sm">
                    Delete Permenantly
                    <ContextMenuShortcut>Delete</ContextMenuShortcut>
                   </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        )
    } ;