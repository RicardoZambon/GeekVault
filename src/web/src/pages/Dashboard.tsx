import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/components/auth-provider"
import { useNavigate } from "react-router-dom"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Package,
  Layers,
  Copy,
  DollarSign,
  TrendingUp,
} from "lucide-react"

interface ConditionCount {
  condition: string
  count: number
}

interface CollectionSummary {
  id: number
  name: string
  itemCount: number
  ownedCount: number
  value: number
}

interface RecentAcquisition {
  id: number
  itemName: string
  condition: string
  purchasePrice: number | null
  estimatedValue: number | null
  acquisitionDate: string | null
  acquisitionSource: string | null
}

interface DashboardData {
  totalCollections: number
  totalItems: number
  totalOwnedCopies: number
  totalEstimatedValue: number
  totalInvested: number
  itemsByCondition: ConditionCount[]
  collectionSummaries: CollectionSummary[]
  recentAcquisitions: RecentAcquisition[]
}

const PIE_COLORS = [
  "hsl(var(--chart-1, 220 70% 50%))",
  "hsl(var(--chart-2, 160 60% 45%))",
  "hsl(var(--chart-3, 30 80% 55%))",
  "hsl(var(--chart-4, 280 65% 60%))",
  "hsl(var(--chart-5, 340 75% 55%))",
  "hsl(var(--chart-6, 200 70% 50%))",
]

export default function Dashboard() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` }
    fetch("/api/dashboard", { headers })
      .then((res) => {
        if (!res.ok) throw new Error("Failed")
        return res.json()
      })
      .then((d) => setData(d))
      .catch(() => setError(t("dashboard.fetchError")))
      .finally(() => setLoading(false))
  }, [token, t])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">{t("dashboard.loading")}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12 text-center text-destructive">{error}</div>
    )
  }

  if (!data) return null

  const statCards = [
    {
      label: t("dashboard.totalCollections"),
      value: data.totalCollections,
      icon: Layers,
    },
    {
      label: t("dashboard.totalItems"),
      value: data.totalItems,
      icon: Package,
    },
    {
      label: t("dashboard.totalOwned"),
      value: data.totalOwnedCopies,
      icon: Copy,
    },
    {
      label: t("dashboard.totalValue"),
      value: `$${data.totalEstimatedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
    },
    {
      label: t("dashboard.totalInvested"),
      value: `$${data.totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("dashboard.description")}</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <card.icon className="h-4 w-4" />
              {card.label}
            </div>
            <div className="mt-2 text-2xl font-bold">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Items by condition - Pie chart */}
        {data.itemsByCondition.length > 0 && (
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">{t("dashboard.itemsByCondition")}</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.itemsByCondition}
                    dataKey="count"
                    nameKey="condition"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {data.itemsByCondition.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Items by condition - Bar chart alternative */}
        {data.itemsByCondition.length > 0 && (
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">{t("dashboard.conditionBreakdown")}</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.itemsByCondition}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="condition" className="text-xs" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--chart-1, 220 70% 50%))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Collection summaries */}
      {data.collectionSummaries.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">{t("dashboard.collectionSummaries")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.collectionSummaries.map((col) => (
              <div
                key={col.id}
                className="cursor-pointer rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-accent"
                onClick={() => navigate(`/collections/${col.id}`)}
              >
                <h3 className="font-semibold">{col.name}</h3>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>{t("dashboard.items")}</span>
                    <span>{col.itemCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("dashboard.owned")}</span>
                    <span>{col.ownedCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("dashboard.value")}</span>
                    <span>${col.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent acquisitions */}
      {data.recentAcquisitions.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">{t("dashboard.recentAcquisitions")}</h2>
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-3 font-medium">{t("dashboard.itemName")}</th>
                    <th className="p-3 font-medium">{t("dashboard.condition")}</th>
                    <th className="p-3 font-medium">{t("dashboard.purchasePrice")}</th>
                    <th className="p-3 font-medium">{t("dashboard.estimatedValue")}</th>
                    <th className="p-3 font-medium">{t("dashboard.date")}</th>
                    <th className="p-3 font-medium">{t("dashboard.source")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentAcquisitions.map((acq) => (
                    <tr key={acq.id} className="border-b last:border-0">
                      <td className="p-3 font-medium">{acq.itemName}</td>
                      <td className="p-3">{acq.condition}</td>
                      <td className="p-3">
                        {acq.purchasePrice != null
                          ? `$${acq.purchasePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : "—"}
                      </td>
                      <td className="p-3">
                        {acq.estimatedValue != null
                          ? `$${acq.estimatedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : "—"}
                      </td>
                      <td className="p-3">
                        {acq.acquisitionDate
                          ? new Date(acq.acquisitionDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="p-3">{acq.acquisitionSource ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {data.totalCollections === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          {t("dashboard.empty")}
        </div>
      )}
    </div>
  )
}
