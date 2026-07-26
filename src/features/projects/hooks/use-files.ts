import { useMutation, useQuery  } from "convex/react";
import {Id} from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@clerk/nextjs";

export const useFile = (fileId: Id<"files"> | null)=>{
    return useQuery(api.file.getFile,fileId?{id:fileId}:"skip");
};
export const useFilePath = (fileId: Id<"files"> | null)=>{
    return useQuery(api.file.getFilePath,fileId?{id:fileId}:"skip");
};
    
export const useCreateFile = ()=>{
    return useMutation(api.file.createFile);
};
export const useUpdateFile = ()=>{
    return useMutation(api.file.updateFile);
};
export const useCreateFolder = ()=>{
    return useMutation(api.file.createFolder);
};
export default useCreateFile

export const useRenameFile=()=>{
    return useMutation(api.file.renameFile)
}
export const useDeleteFile=()=>{
    return useMutation(api.file.deleteFile)
}

export const useFolderContents=({projectId,parentId,enabled=true}:{projectId: Id<"projects">; parentId?: Id<"files">;
enabled?:boolean;})=>{
    return useQuery(
        api.file.getFolderContents,
        enabled?{projectId,parentId}:"skip"
    )
}