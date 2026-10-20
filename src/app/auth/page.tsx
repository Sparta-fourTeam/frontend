import SignIn from "@/modules/auth/signIn";
import { SIGN_OUT_MESSAGE, type SignOutReason } from "@/apis/auth";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const notice =
    reason && reason in SIGN_OUT_MESSAGE
      ? SIGN_OUT_MESSAGE[reason as SignOutReason]
      : null;
  return <SignIn notice={notice} />;
}
