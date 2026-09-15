"use client";
import {z} from "zod";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { SettingsIcon } from "lucide-react";
import { Popover,PopoverContent,PopoverTrigger } from "@/components/ui/popover";
import {Button} from "@/components/ui/button";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Field,FieldLabel,FieldDescription} from "@/components/ui/field"
import { Doc, Id } from "@/../convex/_generated/dataModel";
import { useUpdateProjectSettings } from "@/features/projects/hooks/use-projects";


const formSchema=z.object({
    installCommand:z.string(),
    devCommand:z.string(),
})
interface PreviewSettingPopoverProps{
    projectId:Id<"projects">;
   initialValues?:Doc<"projects">["settings"];
   onSave?:()=>void;
   
};

export const PreviewSettingPopover=({
    projectId,
    initialValues,
    onSave,
}:PreviewSettingPopoverProps)=>{
    
    const [open,setOpen]=useState(false);
    const updateSettings=useUpdateProjectSettings();

    const form = useForm({
        defaultValues:{
            installCommand:initialValues?.installCommand || "",
            devCommand:initialValues?.devCommand || "",
        },
        validators: {
            onSubmit: formSchema,
        },
        onSubmit:async({value})=>{
            await updateSettings({
                id:projectId,
                settings:{
                    installCommand:value.installCommand ||undefined,
                    devCommand:value.devCommand||undefined,
                },
            });
            onSave?.();
            setOpen(false);
        },
    });
    const handleOpenChange=(isOpen:boolean)=>{
         if(isOpen){
            form.reset({
                installCommand:initialValues?.installCommand??"",
                devCommand:initialValues?.devCommand??"",
            });
            
         }
         setOpen(isOpen);
         
    };
    return (    
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button 
                size="sm"
                variant="ghost"
                className="h-full rounded-none"
                title="preview Settings"
                > 
                <SettingsIcon className="size-3"/>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                <form onSubmit={(e)=>{
                    e.preventDefault();
                    form.handleSubmit();
                }}>
                    <div className="space-y-4 ">
                        <div className="space-y-1">
                            <h4 className="font-medium text-sm">Preview Settings</h4>
                            <p className="text-sm text-muted-foreground">configure how your project preview is built and served</p>
                        </div>
                        <form.Field name="installCommand">
                            {(field)=>(
                                <Field>
                                    <FieldLabel htmlFor={field.name}>Install Command</FieldLabel>
                                    
                                    <Input 
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onChange={(e)=>field.handleChange(e.target.value)}
                                    onBlur={()=>field.handleBlur()}
                                    placeholder="npm install"
                                     />
                                     <FieldDescription>
                                        command to install 
                                     </FieldDescription>
                                </Field>
                            )}
                        </form.Field>
                         <form.Field name="devCommand">
                            {(field)=>(
                                <Field>
                                    <FieldLabel htmlFor={field.name}>start Command</FieldLabel>
                                    
                                    <Input 
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onChange={(e)=>field.handleChange(e.target.value)}
                                    onBlur={()=>field.handleBlur()}
                                    placeholder="npm run dev"
                                     />
                                     <FieldDescription>
                                        command to start the development server
                                     </FieldDescription>
                                </Field>
                            )}
                        </form.Field>
                        <form.Subscribe selector={(state)=>[state.canSubmit,state.isSubmitting]}>
                        {([canSubmit,isSubmitting])=>(  
                            <Button type="submit"
                            size="sm"
                            className="w-full"
                            disabled={!canSubmit || isSubmitting}
                            >
                                {isSubmitting ? "Saving..." : "Save Changes"}
                            </Button>

                            
                        )}

                        </form.Subscribe>

                    </div>
                    
                </form>

            </PopoverContent>

        </Popover>
            
    )
    
}