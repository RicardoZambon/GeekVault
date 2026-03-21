import { useTranslation } from "react-i18next"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { motion } from "framer-motion"
import { Card, CardHeader, CardTitle, CardContent, SkeletonRect, durations, easings } from "@/components/ds"

interface ConditionCount {
  condition: string
  count: number
}

interface ChartsSectionProps {
  itemsByCondition: ConditionCount[]
  loading?: boolean
}

const CHART_COLORS = Array.from({ length: 8 }, (_, i) => `var(--chart-${i + 1})`)

const slideUpVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.normal,
      ease: [...easings.enter] as [number, number, number, number],
    },
  },
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: ConditionCount }>
  total?: number
}

function ChartTooltip({ active, payload, total }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  const percentage = total ? ((value / total) * 100).toFixed(1) : null
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-card px-3 py-2 shadow-md">
      <p className="text-sm font-medium text-foreground">{name}</p>
      <p className="text-xs text-muted-foreground">
        {value} {percentage && `(${percentage}%)`}
      </p>
    </div>
  )
}

export function ChartsSection({ itemsByCondition, loading }: ChartsSectionProps) {
  const { t } = useTranslation()
  const total = itemsByCondition.reduce((sum, d) => sum + d.count, 0)

  if (loading) {
    return (
      <div className="grid gap-6 md:gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <Card key={i} variant="flat" className="shadow-sm">
            <CardHeader className="px-5 pt-5 pb-3">
              <SkeletonRect width="50%" height={20} />
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <SkeletonRect width="100%" height={256} className="rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (itemsByCondition.length === 0) {
    return (
      <div className="grid gap-6 md:gap-4 lg:grid-cols-2">
        {[t("dashboard.itemsByCondition"), t("dashboard.conditionBreakdown")].map((title) => (
          <Card key={title} variant="flat" className="shadow-sm">
            <CardHeader className="px-5 pt-5 pb-3">
              <CardTitle className="font-display text-xl font-semibold">{title}</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="flex h-64 items-center justify-center">
                <p className="text-sm text-muted-foreground">{t("dashboard.noConditionData")}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:gap-4 lg:grid-cols-2">
      <motion.div variants={slideUpVariants} initial="hidden" animate="visible">
        <Card variant="flat" className="shadow-sm">
          <CardHeader className="px-5 pt-5 pb-3">
            <CardTitle className="font-display text-xl font-semibold">{t("dashboard.itemsByCondition")}</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={itemsByCondition}
                    dataKey="count"
                    nameKey="condition"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    isAnimationActive
                    animationDuration={800}
                  >
                    {itemsByCondition.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<ChartTooltip total={total} />} />
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-foreground font-display text-2xl font-bold"
                  >
                    {total}
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {itemsByCondition.map((entry, index) => (
                <div key={entry.condition} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="text-xs text-muted-foreground">{entry.condition}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={slideUpVariants} initial="hidden" animate="visible">
        <Card variant="flat" className="shadow-sm">
          <CardHeader className="px-5 pt-5 pb-3">
            <CardTitle className="font-display text-xl font-semibold">{t("dashboard.conditionBreakdown")}</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={itemsByCondition}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="condition"
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip content={<ChartTooltip total={total} />} />
                  <Bar
                    dataKey="count"
                    fill="var(--chart-1)"
                    radius={[6, 6, 0, 0]}
                    isAnimationActive
                    animationDuration={800}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
