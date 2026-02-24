"use client"

interface StarDisplayProps {
  current: number
  total: number
  rewardDescription: string
}

export default function StarDisplay({ current, total, rewardDescription }: StarDisplayProps) {
  const remaining = total - current
  const useCompact = total > 10

  return (
    <div className="space-y-2">
      {useCompact ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                data-progress-bar
                className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((current / total) * 100, 100)}%` }}
              />
            </div>
            <span className="text-sm font-bold text-gray-700 tabular-nums">
              {current}/{total} ⭐
            </span>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              data-star-slot={i}
              className={`text-2xl transition-all duration-300 ${
                i < current ? "opacity-100 drop-shadow-sm" : "opacity-25 grayscale"
              }`}
              style={{ transform: i < current ? "scale(1.1)" : "scale(1)" }}
            >
              ⭐
            </span>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-500">
        {current >= total ? (
          <span className="text-green-600 font-semibold">
            Ready to claim {rewardDescription}!
          </span>
        ) : remaining === 1 ? (
          <>
            <span className="font-semibold text-orange-500">1 more star</span> to go — then {rewardDescription}
          </>
        ) : (
          <>
            <span className="font-semibold text-orange-500">{remaining} more stars</span> to go — then {rewardDescription}
          </>
        )}
      </p>
    </div>
  )
}
