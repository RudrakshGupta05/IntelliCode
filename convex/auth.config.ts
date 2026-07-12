import { AuthConfig } from "convex/server";

export default{
    providers:[{
        domain: "https://enabled-mayfly-78.clerk.accounts.dev",
        applicationID:"convex"
    }]
} satisfies AuthConfig;