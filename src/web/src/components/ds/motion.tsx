import * as React from "react"
import { motion, type HTMLMotionProps, type Variants } from "framer-motion"
import { cn } from "@/lib/utils"

/* v8 ignore next 4 -- environment-dependent at module load */
const prefersReducedMotion =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false

const noopVariants: Variants = { initial: {}, animate: {}, exit: {} }

/* v8 ignore next 3 -- branches depend on module-level constant */
function getVariants(variants: Variants): Variants {
  return prefersReducedMotion ? noopVariants : variants
}

// ---------- PageTransition ----------

export interface PageTransitionProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
}

const pageVariants = getVariants({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
})

const PageTransition = React.forwardRef<HTMLDivElement, PageTransitionProps>(
  ({ className, children, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
)
PageTransition.displayName = "PageTransition"

// ---------- FadeIn ----------

export interface FadeInProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  delay?: number
}

const FadeIn = React.forwardRef<HTMLDivElement, FadeInProps>(
  ({ className, children, delay = 0, ...props }, ref) => {
    const variants = getVariants({
      initial: { opacity: 0 },
      animate: { opacity: 1 },
    })

    return (
      <motion.div
        ref={ref}
        initial="initial"
        animate="animate"
        variants={variants}
        transition={{ duration: 0.3, delay, ease: "easeOut" }}
        className={cn(className)}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
FadeIn.displayName = "FadeIn"

// ---------- StaggerChildren ----------

export interface StaggerChildrenProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  staggerDelay?: number
}

/* v8 ignore next 5 -- branches depend on module-level constant */
export const staggerItemVariants: Variants = prefersReducedMotion
  ? { initial: {}, animate: {} }
  : {
      initial: { opacity: 0, y: 16 },
      animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
    }

const StaggerChildren = React.forwardRef<HTMLDivElement, StaggerChildrenProps>(
  ({ className, children, staggerDelay, ...props }, ref) => {
    /* v8 ignore next 4 -- branches depend on module-level constant */
    const container: Variants = prefersReducedMotion
      ? { initial: {}, animate: {} }
      : {
          animate: {
            transition: {
              staggerChildren: staggerDelay ?? 0.06,
            },
          },
        }

    return (
      <motion.div
        ref={ref}
        initial="initial"
        animate="animate"
        variants={container}
        className={cn(className)}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
StaggerChildren.displayName = "StaggerChildren"

// ---------- ScaleIn ----------

export interface ScaleInProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
}

const scaleVariants = getVariants({
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
})

const ScaleIn = React.forwardRef<HTMLDivElement, ScaleInProps>(
  ({ className, children, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={scaleVariants}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
)
ScaleIn.displayName = "ScaleIn"

export { PageTransition, FadeIn, StaggerChildren, ScaleIn }
