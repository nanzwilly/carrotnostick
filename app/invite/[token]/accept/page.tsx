import { acceptInvite } from "@/app/actions/invites"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const session = await auth()

  // Not logged in — send back to the invite landing page to sign in
  if (!session?.user?.id) {
    redirect(`/invite/${token}`)
  }

  try {
    await acceptInvite(token)
  } catch {
    redirect("/dashboard?invite=error")
  }

  redirect("/dashboard?invite=success")
}
