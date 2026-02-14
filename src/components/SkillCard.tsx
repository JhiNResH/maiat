'use client'

import { TrustBadge } from './TrustBadge'

interface SkillCardProps {
  name: string
  description: string
  image?: string | null
  status: 'approved' | 'pending' | 'rejected'
  avgRating: number
  reviewCount: number
  website?: string | null
}

export function SkillCard({ name, description, image, status, avgRating, reviewCount, website }: SkillCardProps) {
  const stars = '★'.repeat(Math.round(avgRating)) + '☆'.repeat(5 - Math.round(avgRating))
  
  return (
    <div className={`
      relative rounded-xl border p-4 transition-all duration-200
      hover:shadow-lg hover:-translate-y-0.5
      ${status === 'rejected' 
        ? 'border-red-500/20 bg-red-950/20 hover:border-red-500/40' 
        : status === 'pending'
        ? 'border-amber-500/20 bg-zinc-900/50 hover:border-amber-500/40'
        : 'border-zinc-700/50 bg-zinc-900/50 hover:border-purple-500/40'
      }
    `}>
      {/* Warning overlay for flagged */}
      {status === 'rejected' && (
        <div className="absolute top-2 right-2 bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full border border-red-500/30 animate-pulse">
          ⚠️ DANGER
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
          {image ? (
            <img src={image} alt={name} className="w-8 h-8 object-contain" />
          ) : (
            <span className="text-2xl">🧩</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-white truncate">{name}</h3>
            <TrustBadge status={status} size="sm" />
          </div>
          
          <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{description}</p>
          
          <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
            <span className="text-amber-400">{stars}</span>
            <span>{avgRating.toFixed(1)}</span>
            <span>·</span>
            <span>{reviewCount} reviews</span>
          </div>
        </div>
      </div>
    </div>
  )
}
