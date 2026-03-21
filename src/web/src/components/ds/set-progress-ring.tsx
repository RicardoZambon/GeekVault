import { motion } from "framer-motion"
import { Check } from "lucide-react"

/* v8 ignore next 4 -- environment-dependent at module load */
const prefersReducedMotion =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false

const CIRCUMFERENCE = 2 * Math.PI * 15.5 // ≈ 97.39

type RingSize = "sm" | "lg"

export interface SetProgressRingProps {
  /** Completion percentage (0–100) */
  percentage: number
  /** Ring size: "sm" (36×36px) for card rows, "lg" (64×64px) for detail hero */
  size?: RingSize
  /** Show percentage label inside ring (only applies to "lg" size) */
  showLabel?: boolean
  className?: string
}

function getCompletionTier(percentage: number) {
  if (percentage >= 100) {
    return {
      strokeColor: "hsl(var(--success))",
      textClass: "text-success font-semibold",
      glow: true,
    }
  }
  if (percentage >= 50) {
    return {
      strokeColor: "hsl(var(--accent))",
      textClass: "text-accent font-semibold",
      glow: false,
    }
  }
  return {
    strokeColor: "hsl(var(--muted-foreground))",
    textClass: "text-muted-foreground",
    glow: false,
  }
}

const sizeMap: Record<RingSize, { px: number; className: string }> = {
  sm: { px: 36, className: "w-9 h-9" },
  lg: { px: 64, className: "w-16 h-16" },
}

function SetProgressRing({
  percentage,
  size = "sm",
  showLabel = false,
  className,
}: SetProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, percentage))
  const fillLength = (clamped / 100) * CIRCUMFERENCE
  const tier = getCompletionTier(clamped)
  const isComplete = clamped >= 100
  const { className: sizeClass } = sizeMap[size]

  const ring = (
    <svg
      viewBox="0 0 36 36"
      className={`${sizeClass} ${className ?? ""}`}
      style={{ transform: "rotate(-90deg)" }}
      role="img"
      aria-label={`${Math.round(clamped)}% complete`}
    >
      {/* Track */}
      <circle
        cx="18"
        cy="18"
        r="15.5"
        fill="none"
        strokeWidth={3}
        stroke="hsl(var(--muted))"
        strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
      />
      {/* Fill */}
      <circle
        cx="18"
        cy="18"
        r="15.5"
        fill="none"
        strokeWidth={3}
        strokeLinecap="round"
        stroke={tier.strokeColor}
        strokeDasharray={`${fillLength} ${CIRCUMFERENCE}`}
        style={
          prefersReducedMotion
            ? undefined
            : {
                transition:
                  "stroke-dasharray 600ms cubic-bezier(0.2, 0, 0, 1)",
              }
        }
      />
      {/* Glow filter for 100% */}
      {isComplete && (
        <defs>
          <filter id="glow">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="2"
              floodColor="hsl(var(--success))"
              floodOpacity="0.4"
            />
          </filter>
        </defs>
      )}
      {isComplete && (
        <circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          strokeWidth={3}
          strokeLinecap="round"
          stroke={tier.strokeColor}
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          filter="url(#glow)"
        />
      )}
      {/* Center label (lg size only) */}
      {showLabel && size === "lg" && (
        <g style={{ transform: "rotate(90deg)", transformOrigin: "center" }}>
          {isComplete ? (
            <Check
              x={18 - 10}
              y={18 - 10}
              width={20}
              height={20}
              className={tier.textClass}
              stroke="currentColor"
            />
          ) : (
            <text
              x="18"
              y="18"
              textAnchor="middle"
              dominantBaseline="central"
              className={`text-sm font-semibold ${tier.textClass}`}
              fill="currentColor"
            >
              {Math.round(clamped)}%
            </text>
          )}
        </g>
      )}
    </svg>
  )

  // Wrap in motion.div for 100% completion pulse
  if (isComplete && !prefersReducedMotion) {
    return (
      <motion.div
        className="inline-flex"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{
          duration: 0.5,
          type: "spring",
          stiffness: 400,
          damping: 15,
        }}
      >
        {ring}
      </motion.div>
    )
  }

  return ring
}

SetProgressRing.displayName = "SetProgressRing"

export { SetProgressRing, getCompletionTier }
