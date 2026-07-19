import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

import { getItemPadding } from "./constants";
export const LoadingRow=({
    className,level=0
}:{className?:string,level?:number})=>{
    return (
      <div className={cn("flex items-center gap-0.5 h-5.5 text-muted-foreground",className)}
      style={{paddingLeft:getItemPadding(level,true)}}  >
        <Spinner className="size-4 text-ring ml-0.5 "/>
        
      </div>
    )
}   