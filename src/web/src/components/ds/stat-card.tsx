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
      <Card
        ref={ref}
        variant="flat"
        className={cn(
          "shadow-[var(--shadow-sm)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] hover:border-accent/10 transition-all duration-200 active:translate-y-0 active:scale-[0.99]",
          className
        )}
        {...props}
      >
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-accent/10 text-accent [&>svg]:h-5 [&>svg]:w-5">
              {icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-2xl font-semibold font-display tabular-nums">{value}</p>
              {trend && (
                <span className={cn("text-xs font-medium", trendColors[trend.direction])}>
                  {trendArrows[trend.direction]} {trend.text}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
)
StatCard.displayName = "StatCard"

export { StatCard }
