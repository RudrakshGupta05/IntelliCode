import { useMutation, useQuery  } from "convex/react";
import {Id} from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { File } from "lucide-react";
import { file } from "zod";

const sortFiles = <T extends {type:"file"| "folder" ;name:string}>(files:T[])=>{
    return [...files].sort((a,b)=>{
        if(a.type ==="folder" && b.type ==="folder"){
            return -1;
        }   
        if(a.type !== "folder" && b.type === "folder"){
            return 1;
        }
        return a.name.localeCompare(b.name);
    })
};

export const useFiles = (projectId: Id<"projects">)=>{
    return useQuery(api.file.getFiles,projectId?{projectId}:"skip");
};
export const useFile = (fileId: Id<"files"> | null)=>{
    return useQuery(api.file.getFile,fileId?{id:fileId}:"skip");
};
export const useFilePath = (fileId: Id<"files"> | null)=>{
    return useQuery(api.file.getFilePath,fileId?{id:fileId}:"skip");
};
    
export const useCreateFile = ( )=>{
    return useMutation(api.file.createFile).withOptimisticUpdate
    ((localStore,args)=>{
        const existingFiles=localStore.getQuery(api.file.getFolderContents,{
            projectId:args.projectId,
            parentId:args.parentId ?? undefined,
        });
        if(existingFiles !== undefined){
            // eslint-disable-next-line react-hooks/purity -- optimistic update callback runs on mutation, not render
            const now=Date.now();
            const newFile={
                _id:crypto.randomUUID() as Id<"files">,
                _creationTime:now,
                projectId:args.projectId,
                parentId:args.parentId ?? undefined,
                type:"file" as const,
                name:args.name,
                content: args.content,
                updateAt: now,
            };
            localStore.setQuery(api.file.getFolderContents,{
                projectId:args.projectId,
                parentId:args.parentId ?? undefined,
            },sortFiles([...existingFiles,newFile]));
        }
    });
};
export const useUpdateFile = ()=>{
    return useMutation(api.file.updateFile);
};
export const useCreateFolder = ()=>{
    return useMutation(api.file.createFolder).withOptimisticUpdate
    ((localStore,args)=>{
        const existingFiles=localStore.getQuery(api.file.getFolderContents,{
            projectId:args.projectId,
            parentId:args.parentId ?? undefined,
        });
        if(existingFiles !== undefined){
            // eslint-disable-next-line react-hooks/purity -- optimistic update callback runs on mutation, not render
            const now=Date.now();
            const newFolder={
                _id:crypto.randomUUID() as Id<"files">,
                _creationTime:now,
                projectId:args.projectId,
                parentId:args.parentId ?? undefined,
                type:"folder" as const,
                name:args.name,
                
                updateAt: now,
            };
            localStore.setQuery(api.file.getFolderContents,{
                projectId:args.projectId,
                parentId:args.parentId ?? undefined,
            },sortFiles([...existingFiles,newFolder]));
        }
    });;
};
export default useCreateFile

export const useRenameFile=({projectId,parentId}:{
    projectId:Id<"projects">
    parentId?: Id<"files">|null
})=>{
    return useMutation(api.file.renameFile).withOptimisticUpdate((localStore,args)=>{
        const existingFiles=localStore.getQuery(api.file.getFolderContents,{
            projectId,
            parentId:parentId ?? undefined,
        })
        if(existingFiles!==undefined){
            const updateFiles=existingFiles.map((file)=>
            file._id===args.id?{...file,name:args.newName}:file);
            localStore.setQuery(api.file.getFolderContents,{
                projectId,
                parentId:parentId ?? undefined,
            },sortFiles(updateFiles));
        }
    
}) 
}
export const useDeleteFile=({projectId,parentId}:{
    projectId:Id<"projects">
    parentId?: Id<"files">|null
})=>{
    return useMutation(api.file.deleteFile).withOptimisticUpdate((localStorage,args)=>{
        const existingFiles=localStorage.getQuery(api.file.getFolderContents,{
            projectId,
            parentId: parentId ?? undefined,
        });
    

    })

}

export const useFolderContents=({projectId,parentId,enabled=true}:{projectId: Id<"projects">; parentId?: Id<"files">;
enabled?:boolean;})=>{
    return useQuery(
        api.file.getFolderContents,
        enabled?{projectId,parentId}:"skip"
    )
}