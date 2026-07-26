import {Extension} from "@codemirror/state";
import { syntaxHighlighting } from "@codemirror/language";
import { javascript } from "@codemirror/lang-javascript";
import {html} from "@codemirror/lang-html";
import {css} from "@codemirror/lang-css";
import { python } from "@codemirror/lang-python";
import {json} from "@codemirror/lang-json";
import {markdown} from "@codemirror/lang-markdown";
import {sql} from "@codemirror/lang-sql";
import {cpp} from "@codemirror/lang-cpp";
import {xml} from "@codemirror/lang-xml";



export const getLanguageExtension=(fileName:string):Extension=>{
    const ext=fileName.split(".").pop()?.toLowerCase();
    switch(ext){
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
        return javascript();
    case "html":
        return html();
    case "css":
        return css();
    case "py":
        return python();
    case "json":
        return json();
    case "md":
        return markdown();
    case "sql":
        return sql();
    case "cpp":
        return cpp();
    case "xml":
        return xml();
    default:
        return [] ;
    }
};