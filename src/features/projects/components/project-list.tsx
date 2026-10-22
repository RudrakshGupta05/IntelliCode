import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircleIcon, ArrowRightIcon, GlobeIcon, SparkleIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { useProjectsPartial } from "../hooks/use-projects";
import { Doc } from "../../../../convex/_generated/dataModel";
import { FaGithub } from "react-icons/fa";

const formatTimestamp = (timestamp: number) => {
  return formatDistanceToNow(new Date(timestamp), {
    addSuffix: true,
  });
};
const getProjectIcon = (project: Doc<"projects">) => {
  if (project.importStatus === "completed") {
    return <FaGithub className="size-3.5 text-muted-foreground" />;
  }

  if (project.importStatus === "failed") {
    return <AlertCircleIcon className="size-3.5 text-muted-foreground" />;
  }

  if (project.importStatus === "importing") {
    return (
      <FaGithub className="size-3.5 text-muted-foreground animate-pulse" />
    );
  }

  return <GlobeIcon className="size-3.5 text-muted-foreground" />;
};

interface ProjectsListProps {
  onViewAll: () => void;
  onNew: () => void;
}

const ContinueCard = ({ data }: { data: Doc<"projects"> }) => {
  return (
   <div className="flex flex-col gap-2">
      <span className="text-xs text-muted-foreground ">Last updated</span>
      <Button variant="outline" asChild 
      className="justify-start items-start p-4 h-auto bg-background border rounded-none flex flex-col gap-2"><Link className="group" href={`/projects/${data._id}` }>
         <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2"> 
               {getProjectIcon(data)} 
               <span className="font-medium truncate">{data.name}</span>
                 </div><ArrowRightIcon className="size-4
text-muted-foreground group-hover: translate-x-0.5
transition-transform" />
                 
                 </div>
                 <span className="text-xs text-muted-foreground">
{formatTimestamp (data.updatedAt)}
</span>
                 </Link></Button>
   </div>
  );
};
const ProjectItem = ({ data }: { data: Doc<"projects"> }) => {
  return (
    <Link
      href={`/projects/${data._id}`}
      className="group text-sm text-foreground/60 font-medium hover:text-foreground py-1 flex items-center justify-between w-full"
    >
      <div className="flex items-center gap-2 min-w-0">
        {getProjectIcon(data)}
        <span className="truncate">{data.name}</span>
      </div>

      <span className="text-xs text-muted-foreground group-hover:text-foreground/60 transition-colors">
        {formatTimestamp(data.updatedAt)}
      </span>
    </Link>
  );
};

export const ProjectsList = ({
  onViewAll,
  onNew,
}: ProjectsListProps) => {
  const projects = useProjectsPartial(6);

  if (projects === undefined) {
    return <Spinner className="size-4 text-ring" />;
  }
 
  const [mostRecent, ...rest] = projects;

  return (
    <div className="flex flex-col gap-4 w-full">
      {mostRecent && <ContinueCard data={mostRecent} />}
     

      {rest.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">
              Recent Projects
            </span>

            <button
              onClick={onViewAll}
              className="flex items-center gap-2 text-xs text-foreground hover:text-foreground/80 transition-colors"
            >
              <span>View All</span>
              <Kbd className="bg-accent border">⌘K</Kbd>
            </button>
          </div>

          <ul className="flex flex-col">
            {rest.map((project) => (
              <ProjectItem key={project._id} data={project} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProjectsList;

/* import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";
import { ArrowRightIcon, GlobeIcon, SparkleIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { useProjectsPartial } from "../hooks/use-projects";
import { Doc } from "../../../../convex/_generated/dataModel";

const formatTimestamp = (timestamp: number) => {
  return formatDistanceToNow(new Date(timestamp), {
    addSuffix: true,
  });
};

interface ProjectsListProps {
  onViewAll: () => void;
  onNew: () => void;
}

const ProjectItem = ({ data }: { data: Doc<"projects"> }) => {
  return (
    <Link
      href={`/projects/${data._id}`}
      className="group text-sm text-foreground/60 font-medium hover:text-foreground py-1 flex items-center justify-between w-full"
    >
      <div className="flex items-center gap-2 min-w-0">
        <GlobeIcon className="size-4 shrink-0" />
        <span className="truncate">{data.name}</span>
      </div>

      <span className="text-xs text-muted-foreground group-hover:text-foreground/60 transition-colors">
        {formatTimestamp(data.updatedAt)}
      </span>
    </Link>
  );
};

export const ProjectsList = ({
  onViewAll,
  onNew,
}: ProjectsListProps) => {
  const projects = useProjectsPartial(6);

  if (projects === undefined) {
    return <Spinner className="size-4 text-ring" />;
  }

  const [mostRecent, ...rest] = projects;

  return (
    <div className="flex flex-col gap-4 w-full">
      {mostRecent && (
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={onNew}
        >
          <div className="flex items-center gap-2">
            <SparkleIcon className="size-4" />
            <span>New Project</span>
          </div>
          <ArrowRightIcon className="size-4" />
        </Button>
      )}

      {rest.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">
              Recent Projects
            </span>

            <button
              onClick={onViewAll}
              className="flex items-center gap-2 text-xs text-foreground hover:text-foreground/80 transition-colors"
            >
              <span>View All</span>
              <Kbd className="bg-accent border">⌘K</Kbd>
            </button>
          </div>

          <ul className="flex flex-col">
            {rest.map((project) => (
              <ProjectItem key={project._id} data={project} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProjectsList;







<CommandGroup heading="Create New">
                    <CommandItem
                    value="new-project"
                    onSelect={() => {
                        const projectName=uniqueNamesGenerator(
                            {
                                dictionaries: [adjectives,animals,colors],
                                separator:" ",
                                style:"lowerCase",
                                length:3
                            }
                        );
                        createProject({ name: projectName });
                        onOpenChange(false);
                    }}
                    >
                        <SparkleIcon className="size-4" />
                        <span>New Project</span>
                    </CommandItem>
                </CommandGroup> 
*/