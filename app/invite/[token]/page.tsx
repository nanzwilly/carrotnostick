import { getInviteByToken } from "@/app/actions/invites"
import { auth, signIn } from "@/auth"
import { redirect } from "next/navigation"
import InviteAuthForm from "./InviteAuthForm"

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const invite = await getInviteByToken(token)

  if (!invite || invite.expired) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-sm p-8 max-w-sm w-full text-center space-y-4">
          <div className="text-5xl">😕</div>
          <h1 className="text-2xl font-bold text-gray-900">Invite expired</h1>
          <p className="text-gray-500 text-sm">
            This invite link has already been used or has expired. Ask the family owner to
            send a new one.
          </p>
        </div>
      </div>
    )
  }

  const session = await auth()

  // Already logged in → skip the sign-in step
  if (session?.user?.id) {
    redirect(`/invite/${token}/accept`)
  }

  const ownerName = invite.owner?.name ?? "your partner"

  async function googleSignIn() {
    "use server"
    await signIn("google", { redirectTo: `/invite/${token}/accept` })
  }

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-sm p-8 max-w-sm w-full text-center space-y-6">
        <div className="text-5xl">🥕</div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Join {ownerName}&apos;s family
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Sign in to see your children&apos;s goals and give stars together.
          </p>
        </div>
        <InviteAuthForm
          googleSignIn={googleSignIn}
          acceptUrl={`/invite/${token}/accept`}
        />
      </div>
    </div>
  )
}
