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
        settings:v.optional(
            v.object({
                installCommand:v.optional(v.string()),
                devCommand:v.optional(v.string()),
            })
        )
    }).index("by_owner",["ownerId"]),
   
    files:defineTable( {
        projectId:v.id("projects"),
        parentId:v.optional(v.id("files")),
        name:v.string(),
        type:v.union(v.literal("file"),v.literal("folder")),
        content:v.optional(v.string()),
        storageId:v.optional(v.id("_storage")),
        updateAt:v.number(),
    })
    .index("by_project",["projectId"])
    .index("by_parent",["parentId"])
    .index("by_project_parent",["projectId","parentId"]),
conversations:defineTable({
    projectId:v.id("projects"),
    title:v.string(),
    createdAt:v.number(), 
    updatedAt:v.number(), 
}).index("by_project",["projectId"]),

 messages:defineTable({
    conversationId:v.id("conversations"),
    projectId:v.id("projects"),
    role:v.union(v.literal("user"),v.literal("assistant")),
    content:v.string(),
    status:v.union(
                v.literal("processing"),
                v.literal("completed"),
                v.literal("cancelled"),
                        
            ),
    
 })
    .index("by_conversation",["conversationId"])
    .index("by_project_status",["projectId","status"]),  


}); 