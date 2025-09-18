import { SignUp } from "@clerk/clerk-react";

function SignUpPage() {
    return <SignUp forceRedirectUrl={"/login-callback"} />;
}

export default SignUpPage;
