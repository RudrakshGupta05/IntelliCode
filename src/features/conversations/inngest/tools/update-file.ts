import z from "zod";
import { createTool } from "@inngest/agent-kit";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

interface UpdateFileToolOptions {
    internalKey: string;
    projectId?: Id<"projects">;
}

const paramSchema = z.object({
    fileId: z.string().min(1, "File ID or name is required"),
    content: z.string(),
});

export const createUpdateFileTool = ({
    internalKey,
    projectId,
}: UpdateFileToolOptions) => {
    return createTool({
        name: "updateFile",
        description: "Update an existing file in the project with new content. Provide the fileId or filename and the complete updated content.",
        parameters: z.object({
            fileId: z.string().describe("The file ID or filename to update"),
            content: z.string().describe("The complete content to update the file with"),
        }),
        handler: async (params, { step: toolStep }) => {
            const parsed = paramSchema.safeParse(params);
            if (!parsed.success) {
                return `Error: ${parsed.error.issues[0].message}`;
            }

            const { fileId, content } = parsed.data;

            let file = null;
            try {
                file = await convex.query(api.system.getFileById, {
                    internalKey,
                    fileId: fileId as Id<"files">,
                });
            } catch {
                file = null;
            }

            if (!file && projectId) {
                const projectFiles = await convex.query(api.system.getProjectFiles, {
                    internalKey,
                    projectId,
                });
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

            if (!file) {
                return `Error: File "${fileId}" not found. Use listFiles to check existing files.`;
            }
            if (file.type === "folder") {
                return `Error: "${fileId}" is a folder, not a file.`;
            }

            try {
                const execute = async () => {
                    await convex.mutation(api.system.updateFile, {
                        internalKey,
                        fileId: file._id,
                        content,
                    });
                    return `File "${file.name}" updated successfully.`;
                };

                return toolStep ? await toolStep.run("updateFile", execute) : await execute();
            } catch (error) {
                return `Error updating file: ${error instanceof Error ? error.message : "Unknown error occurred"}`;
            }
        },
    });
};