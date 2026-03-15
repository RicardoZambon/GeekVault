import * as React from "react"
import { useSpring, useMotionValue, motion, useTransform } from "framer-motion"

/* v8 ignore next 4 -- environment-dependent at module load */
const prefersReducedMotion =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false

export interface AnimatedNumberProps {
  value: number
  className?: string
  /** Format function applied to the animated value (e.g. toFixed, toLocaleString) */
  format?: (n: number) => string
  /** Spring duration in seconds. Default 0.8 */
  duration?: number
}

function AnimatedNumber({
  value,
  className,
  format = (n) => Math.round(n).toLocaleString(),
  duration = 0.8,
}: AnimatedNumberProps) {
  const motionValue = useMotionValue(0)
  /* v8 ignore start */
  const springValue = useSpring(motionValue, {
    duration: prefersReducedMotion ? 0 : duration * 1000,
    bounce: 0,
  })
  /* v8 ignore stop */
  const display = useTransform(springValue, (v) => format(v))

  React.useEffect(() => {
    motionValue.set(value)
  }, [value, motionValue])

  /* v8 ignore next 3 -- depends on module-level constant */
  if (prefersReducedMotion) {
    return <span className={className}>{format(value)}</span>
  }

  return <motion.span className={className}>{display}</motion.span>
}

AnimatedNumber.displayName = "AnimatedNumber"

export { AnimatedNumber }
