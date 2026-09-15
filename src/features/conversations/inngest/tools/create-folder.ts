import z from "zod";
import { createTool } from "@inngest/agent-kit";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

interface CreateFolderToolOptions{
    projectId:Id<"projects">;
    internalKey:string;
};

const paramSchema=z.object({ 
    parentId:z.union([z.string(), z.null()]).optional(),
    name:z.string().min(1,"Folder name cannot be empty"),
});

export const createCreateFolderTool=({
    projectId,
    internalKey
}:CreateFolderToolOptions)=>{
    return createTool({
        name:"createFolder",
        description:"Create a new folder in project",

        parameters: z.object({
            name: z.string().describe("Name of folder to create"),
            parentId: z.string().describe("The ID of the parent folder from listFiles, or empty string for root level"),

        parameters:z.object({
         name:z.string().describe("Name of folder to create"),
         parentId:z.string().optional().describe("The ID (not name!) of the parent folder from listFiles, or empty string for root level"),

        }),
        handler: async(params,{step:toolStep})=>{
            const parsed=paramSchema.safeParse(params);
            if(!parsed.success){
                return `Error: ${parsed.error.issues[0].message} `;
            };

            const {name,parentId}=parsed.data;
            

            try {
                const execute = async () => {
                    let resolvedParentId: Id<"files"> | undefined;
                    if (parentId && parentId !== "") {
                        try {
                            resolvedParentId = parentId as Id<"files">;
                            const parentFolder = await convex.query(api.system.getFileById, {
                                internalKey,
                                fileId: resolvedParentId,
                            });
                            if (!parentFolder || parentFolder.type === "file") {
                                return `Error: Parent folder with ID "${parentId}" not found. Use listFiles to get valid folder IDs.`;
                            }
                            if (parentFolder.type !== "folder") {
                                return `Error: The ID "${parentId}" is a file, not a folder. Use a folder ID as parentId.`;
                            }
                        } catch {
                            return `Error: Invalid parentId "${parentId}". Use listFiles to get valid folder IDs, or omit for root folders.`;
                        }
                    }

                    // Handle path segments if folder name contains slashes (e.g. "src/components")
                    const segments = name.split("/").filter(Boolean);
                    if (segments.length === 0) {
                        return "Error: Folder name cannot be empty";
                    }

                    let currentParentId = resolvedParentId;
                    let lastFolderId = "";

                    for (const segment of segments) {
                        const existingFiles = await convex.query(api.system.getProjectFiles, {
                            internalKey,
                            projectId,
                        });
                        const existingFolder = existingFiles.find(
                            (f) =>
                                f.type === "folder" &&
                                f.name === segment &&
                                (currentParentId ? f.parentId === currentParentId : !f.parentId)
                        );

                        if (existingFolder) {
                            currentParentId = existingFolder._id;
                            lastFolderId = existingFolder._id;
                        } else {
                            const newFolderId = await convex.mutation(api.system.createFolder, {
                                internalKey,
                                projectId,
                                parentId: currentParentId,
                                name: segment,
                            });
                            currentParentId = newFolderId as Id<"files">;
                            lastFolderId = newFolderId;
                        }
                    }

                    return `Folder created or verified "${name}" with ID ${lastFolderId}`;
                };

                return toolStep ? await toolStep.run("create-folder", execute) : await execute();
            }
=======
            try{
               return await toolStep?.run("create-folder",async()=>{
           
                if(parentId){
                  try{
                    
                    const parentFolder=await convex.query(api.system.getFileById,{
                        internalKey,
                        fileId:parentId as Id<"files">,
                    });
                    if(!parentFolder ||parentFolder.type==="file"){
                        return `Error: Parent folder with ID "${parentId}" not found. Use listFiles to get valid folder IDs.`
                    }
                    if(parentFolder.type !=="folder"){
                        return `Error: The ID "${parentId}" is a file, not a folder. Use a folder ID as parentId.`;
                    }

                  }
                  catch{
                    return `Error:Invalid parentId "${parentId}". Use listFiles to get valid folder IDs, or use empty string for root files `

                  }
                }
                const folderId=await convex.mutation(api.system.createFolder,{
                    internalKey,
                    projectId,
                    parentId:parentId?(parentId as Id<"files">):undefined,
                    name
                    
                })
              
                
                return `folder created ${name} with ID ${folderId}`;
               })
                        }

                        
            catch(error){
                return  `   Error creating folder: ${error instanceof Error?error.message:"Unknown error occurred"} `

            }
            
        
    }})
}