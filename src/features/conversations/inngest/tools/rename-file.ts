import z from "zod";
import { createTool } from "@inngest/agent-kit";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

interface RenameFileToolOptions{
    internalKey:string;
};

const paramSchema=z.object({ 
    fileId:z.string().min(1,"File ID is required"),
    newName:z.string().min(1,"New name is required"),

    
});

export const createRenameFileTool=({
    internalKey
}:RenameFileToolOptions)=>{
    return createTool({
        name:"renameFile",
        description:"Rename a file in the project",
        parameters:z.object({
            fileId:z.string().describe("The file ID to rename"),
            newName:z.string().describe("The new name to rename the file to")
        }),
        handler: async(params,{step:toolStep})=>{
            const parsed=paramSchema.safeParse(params);
            if(!parsed.success){
                return `Error: ${parsed.error.issues[0].message} `;
            };

            const {fileId,newName}=parsed.data;
            const file=await convex.query(api.system.getFileById,{
                internalKey,
                fileId:fileId as Id<"files">
            }); 
            if(!file){
                return `Error: File ${fileId} not found`
            };
         
            try{
                return await toolStep?.run("rename-file",async()=>{
                    await convex.mutation(api.system.renameFile,{
                        internalKey,
                        fileId:fileId as Id<"files">,
                        newName,
                    });
                    return  `File "${file.name}" renamed successfully to "${newName}"`
                
                
                            });
                        }
                        
            catch(error){
                return  `   Error renaming files: ${error instanceof Error?error.message:"Unknown error occurred"} `

            }
            
        
    }})
}