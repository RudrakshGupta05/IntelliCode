import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { helloworld } from "./functions";
import { processMessage } from "@/features/conversations/inngest/process-message";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [helloworld, processMessage],
});