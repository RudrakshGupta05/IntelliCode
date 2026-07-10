import { ShieldAlertIcon } from "lucide-react";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";

export const UnauthenticatedView=()=>{
    return <div className="flex items-center justify-center h-screen">
            
<div className="w-full max-w-lg bg-muted">
< Item variant="outline">
<ItemMedia variant="icon">
<ShieldAlertIcon />
</ItemMedia>
<ItemContent>
<ItemTitle>Unauthorized Access</ItemTitle>
</ItemContent>
</Item>
</div>
    </div>  
}