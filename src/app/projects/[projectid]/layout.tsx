import ProjectIdLayout from '@/features/projects/components/project-id-layout';
import { Id } from '../../../../convex/_generated/dataModel';
import React from 'react'

const layout = async ({children,params}:{children:React.ReactNode;
    params:{projectid:Id<"projects">};
}) => {
    const {projectid}=await params;
  return (
    <ProjectIdLayout projectId={projectid as Id<"projects">}>
      {children} 
      </ProjectIdLayout>
    
  ) 
}

export default layout