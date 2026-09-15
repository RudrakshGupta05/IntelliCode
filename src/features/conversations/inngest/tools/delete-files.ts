import z from "zod";
import { createTool } from "@inngest/agent-kit";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

interface DeleteFilesToolOptions {
    internalKey: string;
    projectId?: Id<"projects">;
}

const paramSchema = z.object({
    fileIds: z
        .union([z.array(z.string()), z.string()])
        .transform((val) => (Array.isArray(val) ? val : [val]))
        .pipe(z.array(z.string().min(1, "File ID cannot be empty")).min(1, "Provide at least one file or folder ID to delete")),
});

export const createDeleteFilesTool = ({
    internalKey,
    projectId,
}: DeleteFilesToolOptions) => {
    return createTool({
        name: "deleteFiles",
        description: "Delete files or folders from the project. Accepts an array of file/folder IDs or names to delete.",
        parameters: z.object({
            fileIds: z
                .union([z.array(z.string()), z.string()])
                .describe("Array of file or folder IDs (or filenames) to delete"),
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

            const itemsToDelete: {
                id: Id<"files">;
                name: string;
                type: string;
            }[] = [];

            for (const fileId of fileIds) {
                let item = null;
                try {
                    item = await convex.query(api.system.getFileById, {
                        internalKey,
                        fileId: fileId as Id<"files">,
                    });
                } catch {
                    item = null;
                }

                if (!item && projectFiles.length > 0) {
                    item =
                        projectFiles.find(
                            (f) =>
                                f._id === fileId ||
                                f.name === fileId ||
                                fileId.endsWith("/" + f.name) ||
                                f.name.toLowerCase() === fileId.toLowerCase()
                        ) ?? null;
                }

                if (!item) {
                    return `Error: File or folder "${fileId}" not found.`;
                }

                itemsToDelete.push({
                    id: item._id,
                    name: item.name,
                    type: item.type,
                });
            }

            try {
                const execute = async () => {
                    const results: string[] = [];
                    for (const item of itemsToDelete) {
                        await convex.mutation(api.system.deleteFile, {
                            internalKey,
                            fileId: item.id,
                        });
                        results.push(`Deleted ${item.type} "${item.name}" successfully`);
                    }
                    return results.join("\n");
                };

                return toolStep ? await toolStep.run("delete-files", execute) : await execute();
            } catch (error) {
                return `Error deleting files: ${error instanceof Error ? error.message : "Unknown error occurred"}`;
            }
        },
    });
};