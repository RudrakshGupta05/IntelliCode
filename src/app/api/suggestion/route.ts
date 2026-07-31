import {generateText,Output} from "ai";
import { NextResponse } from "next/server";
import {z} from "zod";
import { google} from "@ai-sdk/google";
import { auth } from "@clerk/nextjs/server";
//import {anthropic} from "@ai-sdk/anthropic";
import { suggestion } from "@/features/editor/extensions/suggestion";


const suggestionSchema =z.object({
    suggestion:z.string().describe("the suggested code or text"),
});

const SUGGESTION_PROMPT = `You are a code suggestion assistant.

<context>
<file_name>{fileName}</file_name>
<previous_lines>
{previousLines}
</previous_lines>
<current_line number="{lineNumber}">{currentLine}</current_line>
<before_cursor>{textBeforeCursor}</before_cursor>
<after_cursor>{textAfterCursor}</after_cursor>
<next_lines>
{nextLines}
</next_lines>
<full_code>
{code}
</full_code>
</context>

<instructions>
Follow these steps IN ORDER:

1. First, look at next_lines. If next_lines contains ANY code, check if it continues from where the cursor is. If it does, return empty string immediately - the code is already written.

2. Check if before_cursor ends with a complete statement (;, }, )). If yes, return empty string.

3. Only if steps 1 and 2 don't apply: suggest what should be typed at the cursor position, using context from full_code.

Your suggestion is inserted immediately after the cursor, so never suggest code that's already in the file.
</instructions>`;

const QUICK_EDIT_PROMPT = `You are a code editing assistant. Edit the selected code based on the user's instruction.

<context>
<selected_code>
{selectedCode}
</selected_code>
<full_code_context>
{fullCode}
</full_code_context>
</context>

{documentation}

<instruction>
{instruction}
</instruction>

<instructions>
Return ONLY the edited version of the selected code.
Maintain the same indentation level as the original.
Do not include any explanations or comments unless requested.
If the instruction is unclear or cannot be applied, return the original code unchanged.
</instructions>`;

export async function POST(request:Request){
    try{
        const {userId}=await auth();
        if(!userId){
            return NextResponse.json({error:"unauthorised"},{status:403 })
        }
        const{fileName,
            code,currentLine,
            previousLines,
            textBeforeCursor,
            textAfterCursor,
            nextLines,lineNumber
    }=await request.json();
    if(!code){
        return NextResponse.json({error:"code is required"},{status:400})
    }
    const prompt=SUGGESTION_PROMPT.replace("{fileName}",fileName||"")
    .replace("{code}",code)
    .replace("{currentLine}",currentLine)
    .replace("{previousLines}",previousLines||"")
    .replace("{textBeforeCursor}",textBeforeCursor)
    .replace("{textAfterCursor}",textAfterCursor)
    .replace("{nextLines}",nextLines||"")
    .replace("{lineNumber}",lineNumber.toString() );
    const {output}=await generateText({
        model:google("gemini-2.5-flash"),
        output:Output.object({schema:suggestionSchema}),
        prompt,
        
        
    });
    return NextResponse.json({suggestion:output.suggestion});



}
    catch(error){
        console.error("suggestion error:",error);
        return NextResponse.json({error:"failed to generate suggestions"},{status:500});
        
    }
}
 
