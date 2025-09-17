import { SignIn } from "@clerk/clerk-react";

function LoginPage() {
    return <SignIn forceRedirectUrl="/login-callback" />;
}

export default LoginPage;
