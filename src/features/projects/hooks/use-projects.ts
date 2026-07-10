/*eslint-disable react-hooks/purity */
import { useQuery,useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {Id,Doc} from "../../../../convex/_generated/dataModel";
import { useAuth } from "@clerk/nextjs";

export const useProjects =()=>{
    return useQuery(api.projects.get);
};

export const useProjectsPartial =(limit:number)=>{
    return useQuery(api.projects.getPartial,{limit,});
};
export const useCreateProject = () => {
    const { userId } = useAuth();
    return useMutation(api.projects.create).withOptimisticUpdate((localStore, args) => {
        const now = Date.now();
        const newProject: Doc<"projects"> = {
             _id: crypto.randomUUID() as Id<"projects">,
             _creationTime: now,
             name: args.name, 
             ownerId: userId ?? "anonymous",
             updatedAt: now,
        };

        // 1. Optimistically update `api.projects.get`
        const existingProjects = localStore.getQuery(api.projects.get);
        if (existingProjects !== undefined) {
            localStore.setQuery(api.projects.get, {}, [
                 newProject,
                 ...existingProjects 
            ]);
        }

        // 2. Optimistically update `api.projects.getPartial` for the dashboard limit (6)
        const existingPartial = localStore.getQuery(api.projects.getPartial, { limit: 6 });
        if (existingPartial !== undefined) {
            localStore.setQuery(api.projects.getPartial, { limit: 6 }, [
                newProject,
                ...existingPartial.slice(0, 5)
            ]);
        }
    });
};