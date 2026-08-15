import { SignIn } from "@clerk/nextjs";

export const UnauthenticatedView = () => {
    return (
        <div className="flex items-center justify-center h-screen">
            <SignIn />
        </div>
    );
}