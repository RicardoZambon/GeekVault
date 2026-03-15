import { useTranslation } from "react-i18next"
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
import { Card, CardHeader, CardTitle, CardContent, SkeletonRect } from "@/components/ds"

interface ConditionCount {
  condition: string
  count: number
}

interface ChartsSectionProps {
  itemsByCondition: ConditionCount[]
  loading?: boolean
}

const BRAND_COLORS = [
  "#1B3A6B", // deep navy
  "#E8A838", // gold
  "#3B6CB5", // lighter navy
  "#2A9D8F", // teal
  "#6B8EC4", // soft blue
  "#D4A03A", // muted gold
]

export function ChartsSection({ itemsByCondition, loading }: ChartsSectionProps) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <Card key={i} variant="flat">
            <CardHeader>
              <SkeletonRect width="50%" height={20} />
            </CardHeader>
            <CardContent>
              <SkeletonRect width="100%" height={256} className="rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (itemsByCondition.length === 0) return null

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card variant="flat">
        <CardHeader>
          <CardTitle>{t("dashboard.itemsByCondition")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={itemsByCondition}
                  dataKey="count"
                  nameKey="condition"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {itemsByCondition.map((_, index) => (
                    <Cell key={index} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card variant="flat">
        <CardHeader>
          <CardTitle>{t("dashboard.conditionBreakdown")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={itemsByCondition}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="condition" className="text-xs" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#1B3A6B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
