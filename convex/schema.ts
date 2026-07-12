import { defineSchema, defineTable } from "convex/server";
import {v} from "convex/values";

export default defineSchema({
 
    projects: defineTable({
        name: v.string(),
        ownerId:v.string(),
        updatedAt:v.number(),
        importStatus:v.optional(
            v.union(
                v.literal("completed"),
                v.literal("importing"),
                v.literal("failed"),
                v.literal("none")
            )
        ),
        exportStatus:v.optional(
            v.union(
                v.literal("completed"),
                v.literal("cancelled"),
                v.literal("exporting"),
                v.literal("failed"),
                
            )
        ),
        exportRepoUrl:v.optional(v.string()),
    }).index("by_owner",["ownerId"]),
});