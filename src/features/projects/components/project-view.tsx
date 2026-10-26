"use client";
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SparkleIcon } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import {FaGithub} from "react-icons/fa";
import ProjectsList from "./project-list";
import { useEffect, useState } from "react";
import { ProjectsCommandDialog } from "./projects-command-dialog";
import { ImportGithubDialog } from "./import-github-dialog";
import { NewProjectDialog } from "./new-project-dialog";

import { UserButton } from "@clerk/nextjs";

const font=Poppins({
    subsets:["latin"],
    weight:["400","500","600","700"] 
})
export const ProjectsView = () => {

  const[CommandDialogOpen,setCommandDialogOpen]=useState(false)
  const [importDialogOpen,setImportDialogOpen]=useState(false);
  const [newProjectDialogOpen,setNewProjectDialogOpen]=useState(false);
   
  useEffect(() => {
    const handlekeyDown=(e:KeyboardEvent)=>{
     if (e.metaKey ||e.ctrlKey){
      if(e.key=="k"){
        e.preventDefault();
        setCommandDialogOpen((prev)=>!prev);
      }
      if(e.key=="i"){
        e.preventDefault();
        setImportDialogOpen(true);
      }
      if(e.key=="j"){
        e.preventDefault();
        setNewProjectDialogOpen(true);
      }
    }
    }
    document.addEventListener("keydown",handlekeyDown);
    return ()=>{
      document.removeEventListener("keydown",handlekeyDown);
    }
  },[] );
 
    
  
  return (
    <>
    <ProjectsCommandDialog
    open={CommandDialogOpen}
    onOpenChange={setCommandDialogOpen}
    />
    <ImportGithubDialog open={importDialogOpen} onOpenChange={setImportDialogOpen}/>
    <NewProjectDialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}/>
    <div className="min-h-screen bg-sidebar flex flex-col items-center justify-center p-6 md:p-16 relative">
      <div className="absolute top-4 right-4">
        <UserButton />
      </div>
      <div className="w-full max-w-sm mx-auto flex flex-col gap-4 items-center">
        <div className="flex justify-between gap-4 w-full items-center">
          <div className="flex items-center gap-2 w-full group/logo">
          <img src="/logo.svg"  alt="IntelliCode" className="size-[40px] md:size-[46px] transition-all duration-500 group-hover/logo:scale-105 "/>
          <h1 className={cn(
          "text-4xl md:text-5xl font-semibold text-white",font.className
          )}>IntelliCode</h1>
          </div>
        </div>
        <div className="flex flex-col gap-4 w-full">
            <div className="grid grid-cols-2 gap-2">
                <Button variant="outline"
                onClick={()=>setNewProjectDialogOpen(true)}
                className="h-full items-start justify-start p-4 bg-background border flex flex-col gap-6 rounded-none">
                    <div className="flex items-center justify-between w-full"><SparkleIcon className="size-4"/>
                 <Kbd className="bg-accent"> ⌘j</Kbd>
                    </div>
                    <div>
                <span className="text-sm">
                    New 
                </span>
            </div> 
                </Button>
                 <Button variant="outline"
                onClick={()=>setImportDialogOpen(true)}
                className="h-full items-start justify-start p-4 bg-background border flex flex-col gap-6 rounded-none">
                    <div className="flex items-center justify-between w-full"><FaGithub className="size-4"/>
                 <Kbd className="bg-accent"> ⌘i</Kbd>
                    </div>
                    <div>
                <span className="text-sm">
                    Import
                </span>
            </div> 
                </Button>
            </div>
            <ProjectsList onViewAll={()=>{setCommandDialogOpen(true)}} onNew={()=>{setCommandDialogOpen(true)}}/>
        </div>
      </div>
    </div>
    </>
  )
}

export default ProjectsView;