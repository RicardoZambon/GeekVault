import * as React from "react"
import { cn } from "@/lib/utils"

export interface SkeletonRectProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number
  height?: string | number
}

const SkeletonRect = React.forwardRef<HTMLDivElement, SkeletonRectProps>(
  ({ className, width, height, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("skeleton-pulse rounded-md bg-muted", className)}
        style={{ width, height, ...style }}
        {...props}
      />
    )
  }
)
SkeletonRect.displayName = "SkeletonRect"

export interface SkeletonCircleProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: string | number
}

const SkeletonCircle = React.forwardRef<HTMLDivElement, SkeletonCircleProps>(
  ({ className, size = 40, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("skeleton-pulse rounded-full bg-muted", className)}
        style={{ width: size, height: size, ...style }}
        {...props}
      />
    )
  }
)
SkeletonCircle.displayName = "SkeletonCircle"

export interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number
  width?: string | number
}

const SkeletonText = React.forwardRef<HTMLDivElement, SkeletonTextProps>(
  ({ className, lines = 3, width, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="skeleton-pulse rounded-md bg-muted h-4"
            style={{
              width: i === lines - 1 ? "75%" : (width ?? "100%"),
            }}
          />
        ))}
      </div>
    )
  }
)
SkeletonText.displayName = "SkeletonText"

export { SkeletonRect, SkeletonCircle, SkeletonText }
