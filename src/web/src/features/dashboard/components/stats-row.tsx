import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { Library, Package, Box, DollarSign, TrendingUp } from "lucide-react"
import { StatCard, AnimatedNumber, SkeletonRect, staggerItemVariants, StaggerChildren } from "@/components/ds"

interface StatsRowProps {
  totalCollections: number
  totalItems: number
  totalOwnedCopies: number
  totalEstimatedValue: number
  totalInvested: number
  loading?: boolean
}

const formatCurrency = (n: number) =>
  "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function StatsRow({
  totalCollections,
  totalItems,
  totalOwnedCopies,
  totalEstimatedValue,
  totalInvested,
  loading,
}: StatsRowProps) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-3">
              <SkeletonRect width={40} height={40} className="rounded-lg" />
              <div className="space-y-2 flex-1">
                <SkeletonRect width="60%" height={14} />
                <SkeletonRect width="40%" height={24} />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const stats = [
    {
      label: t("dashboard.totalCollections"),
      value: <AnimatedNumber value={totalCollections} />,
      icon: <Library />,
    },
    {
      label: t("dashboard.totalItems"),
      value: <AnimatedNumber value={totalItems} />,
      icon: <Package />,
    },
    {
      label: t("dashboard.totalOwned"),
      value: <AnimatedNumber value={totalOwnedCopies} />,
      icon: <Box />,
    },
    {
      label: t("dashboard.totalValue"),
      value: <AnimatedNumber value={totalEstimatedValue} format={formatCurrency} />,
      icon: <DollarSign />,
    },
    {
      label: t("dashboard.totalInvested"),
      value: <AnimatedNumber value={totalInvested} format={formatCurrency} />,
      icon: <TrendingUp />,
    },
  ]

  return (
    <StaggerChildren className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map((s) => (
        <motion.div key={s.label} variants={staggerItemVariants}>
          <StatCard icon={s.icon} label={s.label} value={s.value} />
        </motion.div>
      ))}
    </StaggerChildren>
  )
}
