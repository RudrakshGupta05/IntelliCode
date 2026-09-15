// src/inngest/client.ts
import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "my-app", isDev: process.env.NODE_ENV !== "production" });