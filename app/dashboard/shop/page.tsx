import { getShopItems } from "@/app/actions/shop"
import Link from "next/link"
import ShopManager from "@/components/ShopManager"

export default async function ShopPage() {
  const items = await getShopItems()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reward Shop</h1>
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back
        </Link>
      </div>

      <p className="text-sm text-gray-500">
        Create rewards that your children can &quot;buy&quot; with their earned stars. Stars earned from any goal count toward the shop balance.
      </p>

      <ShopManager initialItems={items} />
    </div>
  )
}
