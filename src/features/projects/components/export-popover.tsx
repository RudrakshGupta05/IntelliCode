import ky,{HTTPError} from "ky";

import { toast } from "sonner";
import z from "zod";
import {useForm} from "@tanstack/react-form";
import { useClerk } from "@clerk/nextjs";
import React, { useState }  from "react";
import { FaGithub } from "react-icons/fa";
import { Button } from "@/components/ui/button";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

import { CheckCheckIcon,
    CheckCircle2Icon,
    Divide,
    ExternalLinkIcon,
    LoaderIcon,
    XCircleIcon,

 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Field,FieldError,FieldLabel } from "@/components/ui/field";
import { Id } from "../../../../convex/_generated/dataModel";
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProject } from "../hooks/use-projects";
import Link from "next/link";
const formSchema=z.object({
   repoName:z.string().min(1,"Repository name is required").max(100,"Repository name must be less than 100 characters")
   .regex(/^[a-zA-Z0-9_-]+$/, "Invalid characters in repository name"),
   description:z.string().max(350,"description can not be more than 350 characters"),
   visibility:z.enum(["public","private"]),  
});

interface ExportPopoverProps{
   projectId:Id<"projects">,
};

export const ExportPopover=({
    projectId
}:ExportPopoverProps)=>{
const project=useProject(projectId); 
const [open,setOpen]=useState(false);
    const {openUserProfile}=useClerk();
    const exportStatus=project?.exportStatus; 
    const exportRepoUrl=project?.exportRepoUrl; 


    
    const form=useForm({
        defaultValues:{
            
            repoName:project?.name?.replace(/[^a-zA-Z0-9_-]/g, "_")??"",
            visibility:"private" as "public" | "private",
            description:"",

        },
        validators:{
            onSubmit:formSchema,
        },
        onSubmit:async({value})=>{
            try{
            await ky.post("/api/github/export",{
                json:{
                    projectId,
                    repoName:value.repoName,
                    visibility:value.visibility,
                    description:value.description || undefined,
                }
            })
            toast.success("Export started...");
            
        }catch(error){
            if(error instanceof HTTPError){
                const body=await error.response.json<{error:string}>();
                   if(body?.error?.includes("Pro plan required")){
                    toast.error("Pro plan required",{
                        action:{
                            label:"upgrade",
                            onClick:()=>openUserProfile(),
                        }
                    });
                    setOpen(false); 
                    return;
                } 
                if(body.error?.includes("Github not connected")){
                    toast.error("Github not connected",{
                        action:{
                            label:"connect",
                            onClick:()=>
                                openUserProfile(),
                            
                        }
                    });
                    setOpen(false);
                    return;
                    
                }
                

            }
            toast.error("unable to export repositry.Please try again");

            
        }
            


        },

    });
    const handleCancelExport=async ()=>{
        await ky.post("/api/github/export/cancel",{
            json:{projectId},
        })
    };
    const handleResetExport=async ()=>{
        await ky.post("/api/github/export/reset",{
            json:{projectId},
        });
        setOpen(false);
    };

    const renderContent=()=>{
        if(exportStatus==="exporting"){
            return (
                <div className="flex flex-col items-center gap-3">
                    <LoaderIcon className="size-6 animate-spin text-muted-foreground"/>
                    <p className="text-sm text-muted-foreground">
                        Exporting to Github...
                    </p>
                    <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleCancelExport}
                    >
                    Cancel
                    </Button>
                    

                </div>
            )
        }
        if(exportStatus==="completed"&& exportRepoUrl){
            return(
                <div className="flex flex-col items-center gap-3">
                    <CheckCircle2Icon className="size-6 text-emerald-500"/>
                    <p className="text-sm font-medium">Repository created</p>
                    <p className="text-xs text-muted-foreground text-center">
                        Your project has been exported to GitHub
                    </p>
                    <div className="flex flex-col w-full gap-2">
                    <Button size="sm" className="w-full" asChild>
  <Link
    href={exportRepoUrl}
    target="_blank"
    rel="noopener noreferrer"
  >
    <ExternalLinkIcon className="mr-1 size-4" />
    View on GitHub
  </Link>
</Button> 
                <Button size="sm"
                variant="outline"
                className="w-full"
                onClick={handleResetExport}>
                    Close
                </Button>
                    </div>
                    

                </div>
            )
        }
        if(exportStatus==="failed"){
            return (
                 <div className="flex flex-col items-center gap-3">
                    <XCircleIcon className="size-6 text-rose-500"/>
                    <p className="text-sm font-medium">
                       Failed to Export
                    </p>
                    <p className="text-xs text-muted-foreground text-center">
                       Something went wrong. Try again
                    </p>
                    <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleResetExport}
                    >
                   Retry 
                    </Button>
                    

                </div>
            )
        }
        return (
            <form 
            onSubmit={(e)=>{
                e.preventDefault();
                form.handleSubmit();
            }}
            >
                <div className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">Export to GitHub</h4>
                      <p className="text-sm text-muted-foreground"> Export your project to GitHub repository</p>
                    </div>
                    <form.Field name="repoName">
                        {(field)=>{
                            const isInvalid=field.state.meta.isTouched && !field.state.meta.isValid;
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor={field.name}>
                                        Repository name
                                    </FieldLabel>
                                    <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e)=>field.handleChange(e.target.value)}
                                    aria-invalid={isInvalid}
                                    placeholder="repo-name"
                                    />
                                    {isInvalid && <FieldError errors={field.state.meta.errors}/>}
                                </Field>
                            )
                        }}
                    </form.Field>
                    <form.Field name="visibility">
                        {(field)=>{
                           
                            return (
                                <Field>
                                    <FieldLabel htmlFor={field.name}>
                                        Visiblity
                                    </FieldLabel>
                                  
                                  <Select value={field.state.value}
                                  onValueChange={(value:"public"|"private")=>field.handleChange(value)}>
                                    <SelectTrigger id={field.name}>
                                       <SelectValue placeholder="Select visibility"/>

                                    </SelectTrigger>
                                    <SelectContent>
                                         <SelectItem value="private">Private</SelectItem>
                                      <SelectItem value="public">Public</SelectItem>
                                     
                                    </SelectContent>

                                  </Select>
                                </Field>
                            )
                        }}
                    </form.Field>
                     <form.Field name="description">
                        {(field)=>{
                            const isInvalid=field.state.meta.isTouched && !field.state.meta.isValid;
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor={field.name}>
                                        Description
                                    </FieldLabel>
                                    <Textarea
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e)=>field.handleChange(e.target.value)}
                                    aria-invalid={isInvalid}
                                    placeholder="Short description..."
                                    rows={2}
                                    />
                                    {isInvalid && <FieldError errors={field.state.meta.errors}/>}
                                </Field>
                            )
                        }}
                    </form.Field>
                    <form.Subscribe
                    selector={(state)=>[state.canSubmit,state.isSubmitting]}>
                        {([canSubmit,isSubmitting])=>(
                            <Button type="submit" size="sm" className="w-full" disabled={!canSubmit || isSubmitting}>
                                {isSubmitting ? "Exporting... " : "Export"}
                            </Button>
                        )}
                    </form.Subscribe>

                </div>
            </form> 
            
        )
    };

   const getStatusIcon = () => {
  if (exportStatus === "exporting") {
    return <LoaderIcon className="size-3.5 animate-spin" />;
  }

  if (exportStatus === "completed") {
    return <CheckCheckIcon className="size-3.5 text-emerald-500" />;
  }

  if (exportStatus === "failed") {
    return <XCircleIcon className="size-3.5 text-red-500" />;
  }

  return <FaGithub className="size-3.5" />;
};
    return (
        <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 h-full px-3 cursor-pointer text-muted-foreground border-l hover:bg-accent/30"
        >
          {getStatusIcon()}
          <span className="text-sm">export</span>
        </button>
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md">
                {renderContent()}
            </DialogContent>
        </Dialog>
        </>
    )
}
