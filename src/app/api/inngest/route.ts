import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { helloworld } from "./functions";
import { processMessage } from "@/features/conversations/inngest/process-message";
import { exportToGithub } from "@/features/projects/inngest/export-to-github";
import { ImportGithubRepo } from "@/features/projects/inngest/import-github-repo";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [ processMessage,exportToGithub,ImportGithubRepo],
});