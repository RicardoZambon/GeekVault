import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/components/auth-provider"
import { PageHeader, toast } from "@/components/ds"
import { StatsRow } from "./components/stats-row"
import { ChartsSection } from "./components/charts-section"
import { CollectionSummaries } from "./components/collection-summaries"
import { RecentAcquisitions } from "./components/recent-acquisitions"

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

export default function Dashboard() {
  const { t } = useTranslation()
  const { token, user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` }
    fetch("/api/dashboard", { headers })
      .then((res) => {
        if (!res.ok) throw new Error("Failed")
        return res.json()
      })
      .then((d) => setData(d))
      .catch(() => toast.error(t("dashboard.fetchError")))
      .finally(() => setLoading(false))
  }, [token, t])

  const welcomeMsg = user?.displayName
    ? t("dashboard.welcome", { name: user.displayName })
    : t("dashboard.description")

  return (
    <div className="space-y-6">
      <PageHeader title={t("dashboard.title")} description={welcomeMsg} />

      <StatsRow
        totalCollections={data?.totalCollections ?? 0}
        totalItems={data?.totalItems ?? 0}
        totalOwnedCopies={data?.totalOwnedCopies ?? 0}
        totalEstimatedValue={data?.totalEstimatedValue ?? 0}
        totalInvested={data?.totalInvested ?? 0}
        loading={loading}
      />

      <ChartsSection
        itemsByCondition={data?.itemsByCondition ?? []}
        loading={loading}
      />

      <CollectionSummaries
        collections={data?.collectionSummaries ?? []}
        loading={loading}
      />

      <RecentAcquisitions
        acquisitions={data?.recentAcquisitions ?? []}
        loading={loading}
      />
    </div>
  )
}
