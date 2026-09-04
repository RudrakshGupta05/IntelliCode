import z from "zod";
import { createTool } from "@inngest/agent-kit";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

interface UpdateFileToolOptions{
    internalKey:string;
};

const paramSchema=z.object({ 
    fileId:z.string().min(1,"File ID is required"),
    content:z.string(),

    
});

export const createUpdateFileTool=({
    internalKey
}:UpdateFileToolOptions)=>{
    return createTool({
        name:"updateFile",
        description:"Update file in the project.Returns file content",
        parameters:z.object({
            fileId:z.string().describe("The file ID to update"),
            content:z.string().describe("The content to update the file with")
        }),
        handler: async(params,{step:toolStep})=>{
            const parsed=paramSchema.safeParse(params);
            if(!parsed.success){
                return `Error: ${parsed.error.issues[0].message} `;
            };

            const {fileId,content}=parsed.data;
            const file=await convex.query(api.system.getFileById,{
                internalKey,
                fileId:fileId as Id<"files">
            }); 
            if(!file){
                return `Error: File ${fileId} not found`
            };
            if(file.type==="folder"){
                return `Error: File ${fileId} is a folder`
            }
            try{
                return await toolStep?.run("updateFile",async()=>{
                    await convex.mutation(api.system.updateFile,{
                        internalKey,
                        fileId:fileId as Id<"files">,
                        content
                    });
                    return  `File "${file.name}" updated successfully`
                
                
                            });
                        }
                        
            catch(error){
                return  `   Error update files: ${error instanceof Error?error.message:"Unknown error occurred"} `

            }
            
        
    }})
}