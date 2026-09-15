import z from "zod";
import { createTool } from "@inngest/agent-kit";
import { firecrawl } from "@/lib/firecrawl";

const paramSchema=z.object({
    urls:z
    .array(z.url("Invalid URL format"))
    .min(1,"provide atleast 1 url to scrape")
});

export const createScrapeUrlsTool=()=>{
    return createTool({
        name:"scrapeUrls",
        description:"Scrape content from URLs to get documentation or reference material. Use this when the user provides URLs or references external documentation. Returns markdown content from the scraped pages.",
        parameters:z.object({
            urls:z.array(z.string()).describe("Array of Urls to scrape for content")
        }),
        handler:async(params,{step:toolStep})=>{
            const parsed =paramSchema.safeParse(params);
            if(!parsed.success){
                return `Error : ${parsed.error.issues[0].message}`;
            }
            const {urls}=parsed.data;
            try{
                return await toolStep?.run("scrape-urls",async()=>{
                    const results:{url:string;content:string}[]=[];
                    for (const url of urls){
                        try{
                            const result=await firecrawl.scrapeUrl(url,{
                                formats:["markdown"]
                            })
                            if ("markdown" in result && result.markdown) {
                                results.push({
                                    url,content:result.markdown,
                                })
                            }
                        }
                        catch{
                            results.push({
                                url,
                                content:`Failed to scrape url:${url}`
                            })
                        }
                    }
                    if(results.length===0){
                        return "No content could be scrapped for this provided url"
                    }
                    return JSON.stringify(results);

                })
            }
            catch(error){
return `Error scrapping urls: ${error instanceof Error ?error.message :"unknown error"} `
            }
        }
    })
}