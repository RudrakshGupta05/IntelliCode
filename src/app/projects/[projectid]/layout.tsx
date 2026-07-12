import ProjectIdLayout from '@/features/projects/components/project-id-layout';
import React from 'react'

const layout = async ({children,params}:{children:React.ReactNode;
    params:{projectid:string}
}) => {
    const {projectid}=await params;
  return (
    <ProjectIdLayout projectId={projectid}> {children} </ProjectIdLayout>
    
  ) 
}

export default layout