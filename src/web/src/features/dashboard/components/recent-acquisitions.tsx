import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { Clock } from "lucide-react"
import { DataTable, Badge, FadeIn, SkeletonRect, easings } from "@/components/ds"
import type { DataTableColumn } from "@/components/ds"

interface RecentAcquisition {
  id: number
  itemName: string
  condition: string
  purchasePrice: number | null
  estimatedValue: number | null
  acquisitionDate: string | null
  acquisitionSource: string | null
}

interface RecentAcquisitionsProps {
  acquisitions: RecentAcquisition[]
  loading?: boolean
}

const conditionVariant = (condition: string) => {
  switch (condition.toLowerCase()) {
    case "mint":
      return "success" as const
    case "near mint":
    case "excellent":
      return "primary" as const
    case "good":
      return "accent" as const
    case "fair":
      return "warning" as const
    case "poor":
      return "destructive" as const
    default:
      return "default" as const
  }
}

const formatPrice = (v: number | null) =>
  v != null
    ? `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "\u2014"

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return "\u2014"
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays <= 7) return `${diffDays} days ago`
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

const MAX_ROWS = 8

const slideUpVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [...easings.enter] as [number, number, number, number] },
  },
}

export function RecentAcquisitions({ acquisitions, loading }: RecentAcquisitionsProps) {
  const { t } = useTranslation()

  if (!loading && acquisitions.length === 0) {
    return (
      <div>
        <FadeIn>
          <h2 className="mb-4 font-display text-2xl font-semibold">{t("dashboard.recentAcquisitions")}</h2>
        </FadeIn>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Clock className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t("dashboard.noRecentAcquisitions")}</p>
        </div>
      </div>
    )
  }

  const displayed = acquisitions.slice(0, MAX_ROWS)

  const columns: DataTableColumn<RecentAcquisition>[] = [
    {
      header: t("dashboard.itemName"),
      accessor: "itemName",
      render: (_, row) => <span className="font-medium">{row.itemName}</span>,
      className: "min-w-[140px]",
    },
    {
      header: t("dashboard.condition"),
      accessor: "condition",
      render: (_, row) => (
        <Badge variant={conditionVariant(row.condition)} size="sm">
          {row.condition}
        </Badge>
      ),
      className: "w-[100px]",
    },
    {
      header: t("dashboard.purchasePrice"),
      accessor: (row) => formatPrice(row.purchasePrice),
      className: "w-[110px] tabular-nums",
    },
    {
      header: t("dashboard.estimatedValue"),
      accessor: (row) => formatPrice(row.estimatedValue),
      className: "hidden w-[110px] tabular-nums md:table-cell",
    },
    {
      header: t("dashboard.date"),
      accessor: (row) => formatRelativeDate(row.acquisitionDate),
      className: "w-[100px] text-muted-foreground",
    },
    {
      header: t("dashboard.source"),
      accessor: (row) => row.acquisitionSource ?? "\u2014",
      className: "hidden w-[100px] text-muted-foreground lg:table-cell",
    },
  ]

  return (
    <div>
      <FadeIn>
        <h2 className="mb-4 font-display text-2xl font-semibold">{t("dashboard.recentAcquisitions")}</h2>
      </FadeIn>
      {loading ? (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRect key={i} width="100%" height={20} />
          ))}
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={slideUpVariants}
        >
          <DataTable
            columns={columns}
            data={displayed}
            className="rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]"
          />
        </motion.div>
      )}
    </div>
  )
}
