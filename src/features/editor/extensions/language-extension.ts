import {Extension} from "@codemirror/state";
import { syntaxHighlighting } from "@codemirror/language";
import { javascript } from "@codemirror/lang-javascript";
import {html, htmlLanguage} from "@codemirror/lang-html";
import {css} from "@codemirror/lang-css";
import { python } from "@codemirror/lang-python";
import {json} from "@codemirror/lang-json";
import {markdown} from "@codemirror/lang-markdown";
import {sql} from "@codemirror/lang-sql";
import {cpp} from "@codemirror/lang-cpp";
import {xml} from "@codemirror/lang-xml";
import {completeFromList} from "@codemirror/autocomplete";

const htmlTagCompletions = [
  "div", "span", "p", "a", "h1", "h2", "h3", "h4", "h5", "h6",
  "button", "input", "form", "label", "select", "option", "textarea",
  "ul", "ol", "li", "table", "tr", "td", "th", "tbody", "thead",
  "img", "section", "article", "header", "footer", "nav", "aside",
  "main", "script", "style", "link", "meta", "head", "body", "html",
  "iframe", "canvas", "svg", "strong", "em", "code", "pre"
].map(tag => ({ label: tag, type: "type", apply: `<${tag}></${tag}>` }));

export const getLanguageExtension=(fileName:string):Extension=>{
    const ext=fileName.split(".").pop()?.toLowerCase();
    switch(ext){
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
        return javascript();
    case "html":
        return [
          html({ selfClosingTags: true, autoCloseTags: true, matchClosingTags: true }),
          htmlLanguage.data.of({ autocomplete: completeFromList(htmlTagCompletions) })
        ];
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