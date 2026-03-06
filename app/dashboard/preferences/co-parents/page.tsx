import Link from "next/link"
import { redirect } from "next/navigation"
import { and, desc, eq } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { coParents, users } from "@/lib/schema"
import { getOwnerIdForUser } from "@/lib/family"
import InviteButton from "@/components/InviteButton"
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton"

export default async function ManageCoParentsPage({
  searchParams,
}: {
  searchParams: Promise<{ removed?: string; target?: string; error?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const ownerId = await getOwnerIdForUser(session.user.id)
  const isOwner = ownerId === session.user.id
  const { removed, target, error } = await searchParams

  async function removeCoParentAction(formData: FormData) {
    "use server"

    const session = await auth()
    if (!session?.user?.id) redirect("/login")

    const ownerId = await getOwnerIdForUser(session.user.id)
    if (ownerId !== session.user.id) {
      redirect("/dashboard/preferences/co-parents?error=forbidden")
    }

    const coParentId = (formData.get("coParentId") as string | null)?.trim()
    const targetEmail = (formData.get("targetEmail") as string | null)?.trim() ?? ""
    if (!coParentId) {
      redirect("/dashboard/preferences/co-parents?error=invalid")
    }

    await db
      .delete(coParents)
      .where(and(eq(coParents.ownerId, session.user.id), eq(coParents.coParentId, coParentId)))

    const next = new URLSearchParams({ removed: "1" })
    if (targetEmail) next.set("target", targetEmail)
    redirect(`/dashboard/preferences/co-parents?${next.toString()}`)
  }

  async function leaveFamilyAction() {
    "use server"

    const session = await auth()
    if (!session?.user?.id) redirect("/login")

    const ownerId = await getOwnerIdForUser(session.user.id)
    if (ownerId === session.user.id) {
      redirect("/dashboard/preferences/co-parents?error=owner")
    }

    await db
      .delete(coParents)
      .where(and(eq(coParents.ownerId, ownerId), eq(coParents.coParentId, session.user.id)))

    redirect("/dashboard/preferences/co-parents?removed=1&target=your-access")
  }

  const coParentRows = isOwner
    ? await db
        .select({
          id: coParents.coParentId,
          name: users.name,
          email: users.email,
          addedAt: coParents.createdAt,
        })
        .from(coParents)
        .leftJoin(users, eq(users.id, coParents.coParentId))
        .where(eq(coParents.ownerId, session.user.id))
        .orderBy(desc(coParents.createdAt))
    : []

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage co-parents</h1>
          <p className="text-sm text-gray-500 mt-1">Co-parent access is managed at account level.</p>
        </div>
        <Link href="/dashboard/preferences" className="text-sm text-gray-500 hover:text-gray-700">
          {"<- Preferences"}
        </Link>
      </div>

      {removed === "1" && (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Removed access{target ? ` for ${target}` : ""}.
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not update co-parent access. Please try again.
        </div>
      )}

      {isOwner ? (
        <>
          <section className="rounded-3xl bg-white shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-900">Invite a co-parent</h2>
                <p className="text-sm text-gray-500">
                  Generate a secure link to give someone access to your family account.
                </p>
              </div>
              <InviteButton />
            </div>
          </section>

          <section className="rounded-3xl bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Current co-parents</h2>
            </div>
            {coParentRows.length === 0 ? (
              <p className="px-6 py-6 text-sm text-gray-500">No co-parents added yet.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {coParentRows.map((cp) => (
                  <div key={cp.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{cp.name ?? "Unnamed user"}</p>
                      <p className="text-sm text-gray-500">{cp.email ?? "No email"}</p>
                    </div>
                    <form action={removeCoParentAction} className="flex items-center gap-2">
                      <input type="hidden" name="coParentId" value={cp.id} />
                      <input type="hidden" name="targetEmail" value={cp.email ?? ""} />
                      <ConfirmSubmitButton
                        confirmText={`Remove co-parent access for ${cp.email ?? "this user"}?`}
                        className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Remove access
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="rounded-3xl bg-white shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Your access</h2>
          <p className="text-sm text-gray-500">
            You are currently a co-parent in another account. Only the account owner can manage co-parents.
          </p>
          <form action={leaveFamilyAction}>
            <ConfirmSubmitButton
              confirmText="Remove your own co-parent access from this family?"
              className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              Remove my access
            </ConfirmSubmitButton>
          </form>
        </section>
      )}
    </div>
  )
}
