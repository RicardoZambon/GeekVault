import * as React from "react"
import { cn } from "@/lib/utils"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, actionLabel, onAction, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center py-16 px-4 text-center",
          className
        )}
        {...props}
      >
        {icon && (
          <div className="mb-4 text-muted-foreground [&>svg]:h-12 [&>svg]:w-12">
            {icon}
          </div>
        )}
        <h3 className="font-display text-lg font-semibold text-foreground">
          {title}
        </h3>
        {description && (
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {description}
          </p>
        )}
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {actionLabel}
          </button>
        )}
        {children}
      </div>
    )
  }
)
EmptyState.displayName = "EmptyState"

export { EmptyState }
