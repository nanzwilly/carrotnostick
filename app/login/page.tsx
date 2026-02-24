import { auth, signIn } from "@/auth"
import { redirect } from "next/navigation"
import LoginForm from "@/components/LoginForm"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; passwordChanged?: string }>
}) {
  const session = await auth()
  if (session?.user) redirect("/dashboard")

  const { registered, passwordChanged } = await searchParams

  async function googleSignIn() {
    "use server"
    await signIn("google", { redirectTo: "/dashboard" })
  }

  return (
    <LoginForm
      googleSignIn={googleSignIn}
      justRegistered={registered === "1"}
      passwordChanged={passwordChanged === "1"}
    />
  )
}
