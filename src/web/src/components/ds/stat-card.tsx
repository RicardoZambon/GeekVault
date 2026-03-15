import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "./card"

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  trend?: {
    direction: "up" | "down" | "neutral"
    text: string
  }
}

const trendColors = {
  up: "text-success",
  down: "text-destructive",
  neutral: "text-muted-foreground",
} as const

const trendArrows = {
  up: "\u2191",
  down: "\u2193",
  neutral: "\u2192",
} as const

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, icon, label, value, trend, ...props }, ref) => {
    return (
      <Card ref={ref} className={cn("", className)} {...props}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary [&>svg]:h-5 [&>svg]:w-5">
                {icon}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-semibold font-display">{value}</p>
              </div>
            </div>
            {trend && (
              <span className={cn("text-sm font-medium", trendColors[trend.direction])}>
                {trendArrows[trend.direction]} {trend.text}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
)
StatCard.displayName = "StatCard"

export { StatCard }
