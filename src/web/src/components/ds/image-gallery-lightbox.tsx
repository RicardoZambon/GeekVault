import * as React from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { springs, easings, prefersReducedMotion } from "./motion"

export interface ImageGalleryLightboxProps {
  images: string[]
  initialIndex?: number
  open: boolean
  onClose: () => void
}

const backdropVariants = prefersReducedMotion
  ? { initial: {}, animate: {}, exit: {} }
  : {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    }

const imageVariants = prefersReducedMotion
  ? { initial: {}, animate: {}, exit: {} }
  : {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
    }

const backdropTransition = { duration: 0.2, ease: [...easings.enter] as [number, number, number, number] }
const imageEnterTransition = springs.gentle

function getSlideVariants(direction: number) {
  if (prefersReducedMotion) return { initial: {}, animate: {}, exit: {} }
  return {
    initial: { opacity: 0, x: direction > 0 ? 100 : -100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: direction > 0 ? -100 : 100 },
  }
}

const slideTransition = { duration: 0.2, ease: [...easings.enter] as [number, number, number, number] }

const ImageGalleryLightbox = React.forwardRef<HTMLDivElement, ImageGalleryLightboxProps>(
  ({ images, initialIndex = 0, open, onClose }, ref) => {
    const { t } = useTranslation()
    const [currentIndex, setCurrentIndex] = React.useState(initialIndex)
    const [direction, setDirection] = React.useState(0)
    const [isZoomed, setIsZoomed] = React.useState(false)
    const triggerRef = React.useRef<Element | null>(null)
    const closeButtonRef = React.useRef<HTMLButtonElement>(null)

    // Touch state
    const touchStartRef = React.useRef<{ x: number; y: number } | null>(null)

    // Reset state when opening
    React.useEffect(() => {
      if (open) {
        triggerRef.current = document.activeElement
        setCurrentIndex(initialIndex)
        setDirection(0)
        setIsZoomed(false)
      }
    }, [open, initialIndex])

    // Focus close button on open
    React.useEffect(() => {
      if (open) {
        // Small delay to allow AnimatePresence to render
        const timer = setTimeout(() => closeButtonRef.current?.focus(), 50)
        return () => clearTimeout(timer)
      }
    }, [open])

    // Return focus on close
    React.useEffect(() => {
      if (!open && triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus()
        triggerRef.current = null
      }
    }, [open])

    const goTo = React.useCallback(
      (index: number) => {
        if (index < 0 || index >= images.length) return
        setDirection(index > currentIndex ? 1 : -1)
        setCurrentIndex(index)
        setIsZoomed(false)
      },
      [currentIndex, images.length]
    )

    const goPrev = React.useCallback(() => goTo(currentIndex - 1), [goTo, currentIndex])
    const goNext = React.useCallback(() => goTo(currentIndex + 1), [goTo, currentIndex])

    // Keyboard navigation
    React.useEffect(() => {
      if (!open) return
      const handler = (e: KeyboardEvent) => {
        switch (e.key) {
          case "Escape":
            onClose()
            break
          case "ArrowLeft":
            e.preventDefault()
            goPrev()
            break
          case "ArrowRight":
            e.preventDefault()
            goNext()
            break
          case "Home":
            e.preventDefault()
            goTo(0)
            break
          case "End":
            e.preventDefault()
            goTo(images.length - 1)
            break
        }
      }
      window.addEventListener("keydown", handler)
      return () => window.removeEventListener("keydown", handler)
    }, [open, onClose, goPrev, goNext, goTo, images.length])

    // Focus trap
    React.useEffect(() => {
      if (!open) return
      const handler = (e: KeyboardEvent) => {
        if (e.key !== "Tab") return
        const lightbox = document.querySelector("[data-testid='image-lightbox']")
        if (!lightbox) return
        const focusable = lightbox.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
      window.addEventListener("keydown", handler)
      return () => window.removeEventListener("keydown", handler)
    }, [open])

    // Touch handling
    const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }
    }, [])

    const handleTouchEnd = React.useCallback(
      (e: React.TouchEvent) => {
        if (!touchStartRef.current || e.changedTouches.length !== 1) return
        const dx = e.changedTouches[0].clientX - touchStartRef.current.x
        const dy = e.changedTouches[0].clientY - touchStartRef.current.y
        touchStartRef.current = null

        const minSwipe = 50
        if (Math.abs(dy) > Math.abs(dx) && dy > minSwipe) {
          onClose()
        } else if (Math.abs(dx) > minSwipe) {
          if (dx < 0) goNext()
          else goPrev()
        }
      },
      [onClose, goNext, goPrev]
    )

    // Double-click zoom
    const handleDoubleClick = React.useCallback(() => {
      setIsZoomed((z) => !z)
    }, [])

    const slideVars = getSlideVariants(direction)
    const hasPrev = currentIndex > 0
    const hasNext = currentIndex < images.length - 1
    const showDots = images.length > 1 && images.length <= 8

    if (!open) return null

    const content = (
      <AnimatePresence>
        {open && (
          <div
            ref={ref}
            data-testid="image-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={t("lightbox.ariaLabel")}
            className="fixed inset-0 z-50"
          >
            {/* Backdrop */}
            <motion.div
              variants={backdropVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={backdropTransition}
              className="absolute inset-0 bg-black/90 backdrop-blur-[8px]"
              onClick={onClose}
            />

            {/* Content container */}
            <motion.div
              variants={imageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={imageEnterTransition}
              className="absolute inset-0 flex items-center justify-center"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Image */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.img
                  key={currentIndex}
                  src={images[currentIndex]}
                  alt={t("lightbox.imageAlt", { current: currentIndex + 1, total: images.length })}
                  variants={slideVars}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={slideTransition}
                  className={cn(
                    "max-h-[85vh] max-w-[90vw] object-contain rounded-lg select-none",
                    isZoomed && "scale-200 cursor-grab"
                  )}
                  onDoubleClick={handleDoubleClick}
                  draggable={false}
                />
              </AnimatePresence>
            </motion.div>

            {/* Close button */}
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="absolute top-4 right-4 z-50 h-10 w-10 md:h-10 md:w-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/10 transition-colors flex items-center justify-center focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              aria-label={t("lightbox.close")}
            >
              <X className="h-5 w-5" />
            </button>

            {/* Navigation arrows — hidden on mobile, hidden when zoomed */}
            {!isZoomed && hasPrev && (
              <button
                onClick={goPrev}
                className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-50 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/10 transition-colors items-center justify-center focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                aria-label={t("lightbox.prev")}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            {!isZoomed && hasNext && (
              <button
                onClick={goNext}
                className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-50 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/10 transition-colors items-center justify-center focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                aria-label={t("lightbox.next")}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}

            {/* Counter + dots */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
                <span className="bg-black/60 text-white text-sm px-3 py-1.5 rounded-full backdrop-blur-sm">
                  {currentIndex + 1} / {images.length}
                </span>
                {showDots && (
                  <div className="flex gap-1.5 justify-center mt-2">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => goTo(i)}
                        className={cn(
                          "h-1.5 w-1.5 rounded-full transition-colors duration-150",
                          i === currentIndex ? "bg-white" : "bg-white/40"
                        )}
                        aria-label={t("lightbox.goToImage", { index: i + 1 })}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    )

    return createPortal(content, document.body)
  }
)
ImageGalleryLightbox.displayName = "ImageGalleryLightbox"

export { ImageGalleryLightbox }
