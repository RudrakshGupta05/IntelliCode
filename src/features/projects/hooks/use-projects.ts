/*eslint-disable react-hooks/purity */
import { useQuery,useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {Id,Doc} from "../../../../convex/_generated/dataModel";
import { useAuth } from "@clerk/nextjs";

export const useProjects =()=>{
    const { isSignedIn } = useAuth();
    return useQuery(api.projects.get, isSignedIn ? {} : "skip");
};

export const useProject=(projectId:Id<"projects"> | undefined)=>{
    return useQuery(api.projects.getById, projectId ? {id:projectId} : "skip");
};

export const useProjectsPartial =(limit:number)=>{
    const { isSignedIn } = useAuth();
    return useQuery(api.projects.getPartial, isSignedIn ? {limit} : "skip");
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
export const useRenameProject = () => {
    const { userId } = useAuth();
    return useMutation(api.projects.rename).withOptimisticUpdate((localStore, args) => {
        const now = Date.now();
        const newProject: Doc<"projects"> = {
             _id: crypto.randomUUID() as Id<"projects">,
             _creationTime: now,
             name: args.name, 
             ownerId: userId ?? "anonymous",
             updatedAt: now,
        };

        // 1. Optimistically update `api.projects.get`
        const existingProjects = localStore.getQuery(api.projects.getById,{
            id:args.id
        });
        if (existingProjects !== undefined && existingProjects !==null) {
            localStore.setQuery(api.projects.getById, {
                id:args.id
            },{
                ...existingProjects,
                name:args.name,
                updatedAt:Date.now()
            });
        }

        const existingProject = localStore.getQuery(api.projects.get);
         if (existingProject !== undefined && existingProjects !== null) {
            localStore.setQuery(
                api.projects.get,
                {},
                existingProject.map((project) => {
                    return project._id === args.id
                        ? { ...project, name: args.name, updatedAt: Date.now() }
                        : project;
                })
            );
        }
    });
};