import { useEffect, useRef } from "react";
import { EditorView, keymap } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { customTheme } from "../extensions/theme";
import { useMemo } from "react";
import { getLanguageExtension } from "../extensions/language-extension";
import {indentWithTab} from "@codemirror/commands"
import { minimap } from "../extensions/minimap";
import {indentationMarkers} from "@replit/codemirror-indentation-markers";
import { customSetup } from "./custom-setup";

interface props {
    fileName:string;
    initialValue?:string;
    onChange?:(value:string)=>void;
}
export const CodeEditor=({fileName,initialValue ="",onChange}:props)=>{
    const editorRef=useRef<HTMLDivElement>(null);
    const viewRef=useRef<EditorView | null>(null);
    const languageExtension=useMemo(()=> getLanguageExtension(fileName),[fileName])
    useEffect(()=>{
        if(!editorRef.current)return;
        const view = new EditorView({
            parent:editorRef.current,
            doc:initialValue,
            extensions:[ 
                customSetup,
                oneDark,
                customTheme, 
                languageExtension,  
                keymap.of([indentWithTab]),
                minimap(),
                indentationMarkers(),
                EditorView.updateListener.of((update)=>{
                    if(update.docChanged && onChange){
                        onChange(update.state.doc.toString());
                    }
                })
                
                
            ]
        });
        viewRef.current=view;
        return () => {  
            view.destroy(); 

        };
         // eslint-disable-next-line react-hooks/exhaustive-deps -- initialValue only used for the initial document
    },[languageExtension])
    return (
        <div ref={editorRef} className="size-full pl-4 bg-background"/>

    )
}

