import { ProjectIdView } from "@/features/projects/components/project-id-view";
import {Id} from "../../../../convex/_generated/dataModel";
const ProjectIdPage = async ({params}:{
    params:{projectid:string}
})=>{
    const {projectid}=await params;
    return (
     <ProjectIdView projectId={projectid as Id<"projects">}/>
    );
};
 
export default ProjectIdPage;
