import { auth, signIn } from "@/auth"
import { redirect } from "next/navigation"
import LoginForm from "@/components/LoginForm"
import LoginPageContent from "@/components/LoginPageContent"

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
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      {/* Left: how it works + why it works */}
      <aside className="lg:w-1/2 bg-white border-r border-gray-100 flex items-center">
        <LoginPageContent />
      </aside>
      {/* Right: login panel */}
      <section id="login" className="lg:w-1/2 flex items-start justify-center pt-12 lg:pt-16 pb-12 px-6 lg:px-12">
        <LoginForm
          googleSignIn={googleSignIn}
          justRegistered={registered === "1"}
          passwordChanged={passwordChanged === "1"}
        />
      </section>
    </div>
  )
}
