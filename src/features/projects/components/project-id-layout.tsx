"use client";
import { Id } from "../../../../convex/_generated/dataModel";
import { Navbar } from "./navbar";
import{Allotment,} from "allotment" 
import "allotment/dist/style.css"
const MIN_SIDEBAR_WITH = 200;
const MAX_SIDEBAR_WITH = 800; 
const DEFAULT_CONVERSATION_STDEBAR_WITH = 400; 
const DEFAULT_MAIN_SIZE = 1000;
export const ProjectIdLayout = ({
children,
projectId,
}:{
children:React.ReactNode;
projectId:Id<"projects">;
})=> {
    return (
     
       <div className="flex h-screen w-full flex-col ">
        <Navbar projectId={projectId}/>
        <div className="flex-1 flex overflow-hidden relative">
            <Allotment className="flex-1 "
            defaultSizes={[DEFAULT_CONVERSATION_STDEBAR_WITH,DEFAULT_MAIN_SIZE]}>
                <Allotment.Pane snap minSize={MIN_SIDEBAR_WITH} maxSize={MAX_SIDEBAR_WITH} preferredSize={DEFAULT_CONVERSATION_STDEBAR_WITH}>
                    <div>Conversation Sidebar</div>
                </Allotment.Pane>
                 <Allotment.Pane>
                    
                 {children}
                 </Allotment.Pane>
       
            </Allotment>

        </div>
        </div>
        
     );
}
export default ProjectIdLayout;