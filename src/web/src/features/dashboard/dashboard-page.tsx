import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Lock } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { EmptyState, FadeIn, toast } from "@/components/ds"
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

function getGreetingKey(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return "dashboard.greeting.morning"
  if (hour >= 12 && hour < 17) return "dashboard.greeting.afternoon"
  return "dashboard.greeting.evening"
}

export default function Dashboard() {
  const { t } = useTranslation()
  const { token, user } = useAuth()
  const navigate = useNavigate()
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

  const greeting = useMemo(() => {
    if (user?.displayName) {
      return t(getGreetingKey(), { name: user.displayName })
    }
    return t("dashboard.greeting.welcomeBack")
  }, [user?.displayName, t])

  const subtitle = useMemo(() => {
    if (!data || data.totalCollections === 0) return t("dashboard.subtitle.empty")
    return t("dashboard.subtitle.withData", {
      collections: data.totalCollections,
      items: data.totalItems,
    })
  }, [data, t])

  const isEmpty = !loading && data !== null && data.totalCollections === 0

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <FadeIn>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground" style={{ letterSpacing: "-0.02em" }}>
            {greeting}
          </h1>
        </FadeIn>
        <FadeIn delay={0.06}>
          <p className="text-lg text-muted-foreground">{subtitle}</p>
        </FadeIn>
      </div>

      {isEmpty ? (
        <EmptyState
          icon={<Lock />}
          title={t("emptyStates.dashboard.title")}
          description={t("emptyStates.dashboard.description")}
          actionLabel={t("emptyStates.dashboard.action")}
          onAction={() => navigate("/collections?create=true")}
        />
      ) : (
        <>
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
        </>
      )}
    </div>
  )
}
