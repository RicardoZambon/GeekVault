import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Sparkles } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { FadeIn, ScaleIn, StaggerChildren, staggerItemVariants, SkeletonRect, toast } from "@/components/ds"
import { motion } from "framer-motion"
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
      {loading ? (
        <div className="space-y-1.5">
          <SkeletonRect width={280} height={36} />
          <SkeletonRect width={200} height={18} />
        </div>
      ) : (
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
      )}

      {isEmpty ? (
        <StaggerChildren className="flex flex-col items-center justify-center py-16 px-4 text-center" staggerDelay={0.06}>
          <motion.div variants={staggerItemVariants}>
            <ScaleIn>
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
                <Sparkles className="h-12 w-12 text-accent" />
              </div>
            </ScaleIn>
          </motion.div>
          <motion.div variants={staggerItemVariants}>
            <h1 className="font-display text-3xl font-bold text-foreground" style={{ letterSpacing: "-0.02em" }}>
              {t("emptyStates.dashboard.title")}
            </h1>
          </motion.div>
          <motion.div variants={staggerItemVariants}>
            <p className="mt-2 max-w-[360px] text-lg text-muted-foreground">
              {t("emptyStates.dashboard.description")}
            </p>
          </motion.div>
          <motion.div variants={staggerItemVariants}>
            <button
              onClick={() => navigate("/collections?create=true")}
              className="mt-6 inline-flex items-center rounded-[var(--radius-md)] bg-primary px-6 py-2 text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {t("emptyStates.dashboard.action")}
            </button>
          </motion.div>
          <motion.div variants={staggerItemVariants}>
            <p className="mt-3 text-xs text-muted-foreground">
              {t("emptyStates.dashboard.hint")}
            </p>
          </motion.div>
        </StaggerChildren>
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
