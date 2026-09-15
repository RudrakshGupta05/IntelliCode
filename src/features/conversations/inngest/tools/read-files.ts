import z from "zod";
import { createTool } from "@inngest/agent-kit";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";


interface ReadFilesToolOptions {
    internalKey: string;
    projectId?: Id<"projects">;
}

const paramSchema = z.object({
    fileIds: z
        .union([z.array(z.string()), z.string()])
        .transform((val) => (Array.isArray(val) ? val : [val]))
        .pipe(z.array(z.string().min(1, "File ID cannot be empty")).min(1, "Provide at least 1 File ID")),
});

export const createReadFilesTool = ({
    internalKey,
    projectId,
}: ReadFilesToolOptions) => {
    return createTool({
        name: "readFiles",
        description: "Read files from the project. Accepts an array of file IDs or filenames and returns their contents.",
        parameters: z.object({
            fileIds: z
                .union([z.array(z.string()), z.string()])
                .describe("Array of the file IDs or filenames to read"),
        }),
        handler: async (params, { step: toolStep }) => {
            const parsed = paramSchema.safeParse(params);
            if (!parsed.success) {
                return `Error: ${parsed.error.issues[0].message}`;
            }

            const { fileIds } = parsed.data;

            let projectFiles: any[] = [];
            if (projectId) {
                try {
                    projectFiles = await convex.query(api.system.getProjectFiles, {
                        internalKey,
                        projectId,
                    });
                } catch {
                    projectFiles = [];
                }
            }

            try {
                const results: {
                    id: string;
                    name: string;
                    content: string;
                }[] = [];

                for (const fileId of fileIds) {
                    let file = null;
                    try {
                        file = await convex.query(api.system.getFileById, {
                            internalKey,
                            fileId: fileId as Id<"files">,
                        });
                    } catch {
                        file = null;
                    }

                    if (!file && projectFiles.length > 0) {
                        file =
                            projectFiles.find(
                                (f) =>
                                    f.type === "file" &&
                                    (f._id === fileId ||
                                        f.name === fileId ||
                                        fileId.endsWith("/" + f.name) ||
                                        f.name.toLowerCase() === fileId.toLowerCase())
                            ) ?? null;
                    }

                    if (file && file.content !== undefined) {
                        results.push({
                            id: file._id,
                            name: file.name,
                            content: file.content,
                        });
                    }
                }

                if (results.length === 0) {
                    return "Error: No files found with provided IDs or names. Use listFiles to see valid files.";
                }
                return JSON.stringify(results);
            } catch (error) {
                return `Error reading files: ${error instanceof Error ? error.message : "Unknown error occurred"}`;
            }
        },
    });
};interface ReadFilesToolOptions{
    internalKey:string;
};

const paramSchema=z.object({
    fileIds:z
    .array(z.string().min(1,"File ID cannot be empty"))
    .min(1,"Provide atleast 1 File ID")
});

export const createReadFilesTool=({
    internalKey
}:ReadFilesToolOptions)=>{
    return createTool({
        name:"readFiles",
        description:"Read files from the project.Returns file content",
        parameters:z.object({
            fileIds:z.array(z.string()).describe("Array of the file IDs to read")
        }),
        handler: async(params,{step:toolStep})=>{
            const parsed=paramSchema.safeParse(params);
            if(!parsed.success){
                return `Error: ${parsed.error.issues[0].message} `;
            };

            const {fileIds}=parsed.data;
            try{
                const results:{
                    id:string;name:string;content:string;}[]=[];
                    for (const fileId of fileIds){
                        const file=await convex.query(api.system.getFileById,{
                            internalKey,
                            fileId:fileId as Id<"files">
                        });
                        if(file && file.content){
                            results.push({
                                id:fileId,
                                name:file.name,
                                content:file.content,
                            });
                        }
                        
        }
        if (results.length===0){
            return "Error:No files found with provided Id.Use listFiles to get valid FileIDs"
        }
        return JSON.stringify(results);
            }
            catch(error){
                return  `   Error reading files: ${error instanceof Error?error.message:"Unknown error occurred"} `

            }
            
        
    }})
}

