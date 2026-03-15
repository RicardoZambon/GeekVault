import { useTranslation } from "react-i18next"
import { DataTable, Badge, SkeletonRect } from "@/components/ds"
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

export function RecentAcquisitions({ acquisitions, loading }: RecentAcquisitionsProps) {
  const { t } = useTranslation()

  if (!loading && acquisitions.length === 0) return null

  const columns: DataTableColumn<RecentAcquisition>[] = [
    {
      header: t("dashboard.itemName"),
      accessor: "itemName",
      render: (_, row) => <span className="font-medium">{row.itemName}</span>,
    },
    {
      header: t("dashboard.condition"),
      accessor: "condition",
      render: (_, row) => (
        <Badge variant={conditionVariant(row.condition)} size="sm">
          {row.condition}
        </Badge>
      ),
    },
    {
      header: t("dashboard.purchasePrice"),
      accessor: (row) => formatPrice(row.purchasePrice),
    },
    {
      header: t("dashboard.estimatedValue"),
      accessor: (row) => formatPrice(row.estimatedValue),
    },
    {
      header: t("dashboard.date"),
      accessor: (row) =>
        row.acquisitionDate
          ? new Date(row.acquisitionDate).toLocaleDateString()
          : "\u2014",
    },
    {
      header: t("dashboard.source"),
      accessor: (row) => row.acquisitionSource ?? "\u2014",
    },
  ]

  return (
    <div>
      <h2 className="mb-4 font-display text-lg font-semibold">{t("dashboard.recentAcquisitions")}</h2>
      {loading ? (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRect key={i} width="100%" height={20} />
          ))}
        </div>
      ) : (
        <DataTable columns={columns} data={acquisitions} />
      )}
    </div>
  )
}
