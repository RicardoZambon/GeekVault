import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Library } from "lucide-react"
import {
  FadeIn,
  StaggerChildren,
  staggerItemVariants,
  springs,
  SkeletonRect,
} from "@/components/ds"

interface CollectionSummary {
  id: number
  name: string
  itemCount: number
  ownedCount: number
  value: number
  coverImagePath?: string | null
}

interface CollectionSummariesProps {
  collections: CollectionSummary[]
  totalCount?: number
  loading?: boolean
}

const GRADIENTS = [
  "linear-gradient(135deg, hsl(var(--accent) / 0.15), hsl(var(--accent) / 0.05))",
  "linear-gradient(135deg, hsl(var(--chart-2) / 0.12), hsl(var(--chart-5) / 0.08))",
  "linear-gradient(135deg, hsl(var(--chart-3) / 0.12), hsl(var(--chart-6) / 0.08))",
]

const MAX_CARDS = 6

export function CollectionSummaries({ collections, totalCount, loading }: CollectionSummariesProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div>
        <SkeletonRect width={200} height={24} className="mb-4" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-[var(--shadow-sm)]">
              <SkeletonRect width="100%" height={120} />
              <div className="space-y-2 p-4">
                <SkeletonRect width="70%" height={18} />
                <SkeletonRect width="100%" height={14} />
                <SkeletonRect width="100%" height={14} />
                <SkeletonRect width="100%" height={14} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (collections.length === 0) return null

  const displayed = collections.slice(0, MAX_CARDS)
  const total = totalCount ?? collections.length
  const showViewAll = total > MAX_CARDS

  return (
    <div>
      <FadeIn>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold">{t("dashboard.yourCollections")}</h2>
          {showViewAll && (
            <button
              onClick={() => navigate("/collections")}
              className="text-sm text-accent transition-colors hover:underline"
            >
              {t("dashboard.viewAllCount", { count: total })}
            </button>
          )}
        </div>
      </FadeIn>
      <StaggerChildren className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {displayed.map((col, index) => (
          <motion.div
            key={col.id}
            variants={staggerItemVariants}
            whileHover={{ y: -2, boxShadow: "var(--shadow-md)" }}
            whileTap={{ scale: 0.99 }}
            transition={springs.default}
            className="group cursor-pointer overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-[var(--shadow-sm)] transition-[border-color] hover:border-accent/10"
            role="link"
            tabIndex={0}
            onClick={() => navigate(`/collections/${col.id}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter") navigate(`/collections/${col.id}`)
            }}
          >
            {/* Cover image area */}
            <div className="h-[120px] overflow-hidden">
              {col.coverImagePath ? (
                <img
                  src={col.coverImagePath}
                  alt={col.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{ background: GRADIENTS[index % GRADIENTS.length] }}
                >
                  <Library className="h-8 w-8 text-muted-foreground/40" />
                </div>
              )}
            </div>

            {/* Content area */}
            <div className="space-y-1 p-4">
              <h4 className="truncate font-display text-lg font-semibold text-foreground">
                {col.name}
              </h4>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("dashboard.items")}</span>
                <span className="font-medium text-foreground">{col.itemCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("dashboard.owned")}</span>
                <span className="font-medium text-foreground">{col.ownedCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("dashboard.value")}</span>
                <span className="font-medium tabular-nums text-foreground">
                  ${col.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </StaggerChildren>
    </div>
  )
}
