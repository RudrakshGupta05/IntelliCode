import z from "zod";
import { createTool } from "@inngest/agent-kit";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

interface CreateFileToolOptions{
    projectId:Id<"projects">;
    internalKey:string;
};

const paramSchema=z.object({ 
    parentId:z.union([z.string(), z.null()]).optional(),
    files:z.array(
        z.object({
            name:z.string().min(1,"File cannot be empty"),
            content:z.string(),
            
        })
    )
.min(1,"Provide at least one file to create")
    
});

export const createCreateFileTool=({
    projectId,
    internalKey
}:CreateFileToolOptions)=>{
    return createTool({
        name:"createFiles",
        description:"Create multiple files at once in the same folder. Use this to batch create files that share the same parent folder. More efficient than creating files one by one",
        parameters: z.object({
            parentId: z.string().describe("The parent folder ID to create files in, or empty string for root level"),
            files: z.array(
                z.object({
                    name: z.string().describe("File name including extensions"),
                    content: z.string().describe("File content")
                })
            ).describe("Array of files to create")
        }),
        handler: async(params,{step:toolStep})=>{
            const parsed=paramSchema.safeParse(params);
            if(!parsed.success){
                return `Error: ${parsed.error.issues[0].message} `;
            };

            const {parentId,files}=parsed.data;
            
            
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
                            return `Error: Invalid parentId "${parentId}". Use listFiles to get valid folder IDs, or omit for root files.`;
                        }
                    }

                    // Pre-fetch all project files to resolve folders and existing files
                    let allProjectFiles = await convex.query(api.system.getProjectFiles, {
                        internalKey,
                        projectId,
                    });

                    // Helper to get or create folder by path segments
                    const getOrCreateFolder = async (
                        segments: string[],
                        baseParentId?: Id<"files">
                    ): Promise<Id<"files">> => {
                        let currentParent = baseParentId;
                        for (const seg of segments) {
                            const found = allProjectFiles.find(
                                (f) =>
                                    f.type === "folder" &&
                                    f.name === seg &&
                                    (currentParent ? f.parentId === currentParent : !f.parentId)
                            );
                            if (found) {
                                currentParent = found._id;
                            } else {
                                const newId = await convex.mutation(api.system.createFolder, {
                                    internalKey,
                                    projectId,
                                    parentId: currentParent,
                                    name: seg,
                                });
                                currentParent = newId as Id<"files">;
                                allProjectFiles.push({
                                    _id: newId as Id<"files">,
                                    _creationTime: Date.now(),
                                    projectId,
                                    parentId: currentParent,
                                    name: seg,
                                    type: "folder",
                                    updateAt: Date.now(),
                                });
                            }
                        }
                        return currentParent!;
                    };

                    // Group files by their resolved parent folder
                    const filesByParent = new Map<Id<"files"> | undefined, { name: string; content: string }[]>();

                    for (const f of files) {
                        const cleanName = f.name.replace(/^\.\//, "");
                        const segments = cleanName.split("/").filter(Boolean);
                        if (segments.length === 0) continue;

                        let targetParent = resolvedParentId;
                        let fileName = segments[0];

                        if (segments.length > 1) {
                            const folderSegments = segments.slice(0, -1);
                            fileName = segments[segments.length - 1];
                            targetParent = await getOrCreateFolder(folderSegments, resolvedParentId);
                        }

                        const list = filesByParent.get(targetParent) || [];
                        list.push({ name: fileName, content: f.content });
                        filesByParent.set(targetParent, list);
                    }

                    const createdNames: string[] = [];
                    const updatedNames: string[] = [];
                    const failedNames: string[] = [];

                    for (const [parent, fileGroup] of filesByParent.entries()) {
                        const results = await convex.mutation(api.system.createFiles, {
                            internalKey,
                            projectId,
                            parentId: parent,
                            files: fileGroup,
                        });

                        for (const r of results) {
                            if (!r.error) {
                                createdNames.push(r.name);
                            } else if (r.error === "file already exists" && r.fileId) {
                                const matchingFile = fileGroup.find((item) => item.name === r.name);
                                if (matchingFile) {
                                    await convex.mutation(api.system.updateFile, {
                                        internalKey,
                                        fileId: r.fileId as Id<"files">,
                                        content: matchingFile.content,
                                    });
                                    updatedNames.push(r.name);
                                }
                            } else {
                                failedNames.push(`${r.name} (${r.error})`);
                            }
                        }
                    }

                    const parts: string[] = [];
                    if (createdNames.length > 0) {
                        parts.push(`Created: ${createdNames.join(", ")}`);
                    }
                    if (updatedNames.length > 0) {
                        parts.push(`Updated: ${updatedNames.join(", ")}`);
                    }
                    if (failedNames.length > 0) {
                        parts.push(`Failed: ${failedNames.join(", ")}`);
                    }
                    return parts.join("; ") || "No files created or updated.";
                };

                return toolStep ? await toolStep.run("create-files", execute) : await execute();
            }
                        
            catch(error){
                return  `   Error creating files: ${error instanceof Error?error.message:"Unknown error occurred"} `

            }
            
        
    }})
}