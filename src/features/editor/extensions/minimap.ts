import { showMinimap } from "@replit/codemirror-minimap";
import { Extension } from "@codemirror/state";

export const createMinimap=()=>{
    const dom=document.createElement("div");
    return {dom};
};

export const minimap=(): Extension=>{
    return showMinimap.compute(["doc"],()=>{
        return {
            create:createMinimap,

        };
    });

};