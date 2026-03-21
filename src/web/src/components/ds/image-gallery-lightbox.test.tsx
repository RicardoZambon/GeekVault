import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ImageGalleryLightbox } from "./image-gallery-lightbox"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (params) return `${key}:${JSON.stringify(params)}`
      return key
    },
  }),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className, onClick, onTouchStart, onTouchEnd, ...rest }: Record<string, unknown>) => {
      const filtered: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(rest)) {
        if (!["variants", "initial", "animate", "exit", "transition", "whileHover", "whileTap"].includes(k)) {
          filtered[k] = v
        }
      }
      return <div className={className as string} onClick={onClick as React.MouseEventHandler} onTouchStart={onTouchStart as React.TouchEventHandler} onTouchEnd={onTouchEnd as React.TouchEventHandler} {...filtered}>{children as React.ReactNode}</div>
    },
    img: ({ className, alt, src, onDoubleClick, ...rest }: Record<string, unknown>) => {
      const filtered: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(rest)) {
        if (!["variants", "initial", "animate", "exit", "transition", "whileHover", "whileTap", "draggable"].includes(k)) {
          filtered[k] = v
        }
      }
      return <img className={className as string} alt={alt as string} src={src as string} onDoubleClick={onDoubleClick as React.MouseEventHandler} {...filtered} />
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const images = ["/uploads/img1.jpg", "/uploads/img2.jpg", "/uploads/img3.jpg"]

describe("ImageGalleryLightbox", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("does not render when closed", () => {
    render(<ImageGalleryLightbox images={images} open={false} onClose={vi.fn()} />)
    expect(screen.queryByTestId("image-lightbox")).not.toBeInTheDocument()
  })

  it("renders when open with dialog role", () => {
    render(<ImageGalleryLightbox images={images} open={true} onClose={vi.fn()} />)
    const lightbox = screen.getByTestId("image-lightbox")
    expect(lightbox).toBeInTheDocument()
    expect(lightbox).toHaveAttribute("role", "dialog")
    expect(lightbox).toHaveAttribute("aria-modal", "true")
  })

  it("renders the image at initialIndex", () => {
    render(<ImageGalleryLightbox images={images} initialIndex={1} open={true} onClose={vi.fn()} />)
    const img = screen.getByRole("img")
    expect(img).toHaveAttribute("src", "/uploads/img2.jpg")
  })

  it("shows image counter for multiple images", () => {
    render(<ImageGalleryLightbox images={images} open={true} onClose={vi.fn()} />)
    expect(screen.getByText("1 / 3")).toBeInTheDocument()
  })

  it("does not show counter for single image", () => {
    render(<ImageGalleryLightbox images={["/uploads/img1.jpg"]} open={true} onClose={vi.fn()} />)
    expect(screen.queryByText(/\//)).not.toBeInTheDocument()
  })

  it("shows dot indicators for <= 8 images", () => {
    render(<ImageGalleryLightbox images={images} open={true} onClose={vi.fn()} />)
    // 3 dot buttons
    const dots = screen.getAllByRole("button").filter((btn) =>
      btn.classList.contains("rounded-full") && btn.classList.contains("h-1.5")
    )
    expect(dots).toHaveLength(3)
  })

  it("has close button with aria-label", () => {
    render(<ImageGalleryLightbox images={images} open={true} onClose={vi.fn()} />)
    expect(screen.getByLabelText("lightbox.close")).toBeInTheDocument()
  })

  it("calls onClose when close button clicked", () => {
    const onClose = vi.fn()
    render(<ImageGalleryLightbox images={images} open={true} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText("lightbox.close"))
    expect(onClose).toHaveBeenCalled()
  })

  it("calls onClose on Escape key", () => {
    const onClose = vi.fn()
    render(<ImageGalleryLightbox images={images} open={true} onClose={onClose} />)
    fireEvent.keyDown(window, { key: "Escape" })
    expect(onClose).toHaveBeenCalled()
  })

  it("navigates to next image on ArrowRight", () => {
    render(<ImageGalleryLightbox images={images} open={true} onClose={vi.fn()} />)
    fireEvent.keyDown(window, { key: "ArrowRight" })
    const img = screen.getByRole("img")
    expect(img).toHaveAttribute("src", "/uploads/img2.jpg")
    expect(screen.getByText("2 / 3")).toBeInTheDocument()
  })

  it("navigates to previous image on ArrowLeft", () => {
    render(<ImageGalleryLightbox images={images} initialIndex={2} open={true} onClose={vi.fn()} />)
    fireEvent.keyDown(window, { key: "ArrowLeft" })
    const img = screen.getByRole("img")
    expect(img).toHaveAttribute("src", "/uploads/img2.jpg")
  })

  it("navigates to first image on Home key", () => {
    render(<ImageGalleryLightbox images={images} initialIndex={2} open={true} onClose={vi.fn()} />)
    fireEvent.keyDown(window, { key: "Home" })
    expect(screen.getByRole("img")).toHaveAttribute("src", "/uploads/img1.jpg")
  })

  it("navigates to last image on End key", () => {
    render(<ImageGalleryLightbox images={images} open={true} onClose={vi.fn()} />)
    fireEvent.keyDown(window, { key: "End" })
    expect(screen.getByRole("img")).toHaveAttribute("src", "/uploads/img3.jpg")
  })

  it("does not go below 0", () => {
    render(<ImageGalleryLightbox images={images} initialIndex={0} open={true} onClose={vi.fn()} />)
    fireEvent.keyDown(window, { key: "ArrowLeft" })
    expect(screen.getByRole("img")).toHaveAttribute("src", "/uploads/img1.jpg")
  })

  it("does not go beyond last image", () => {
    render(<ImageGalleryLightbox images={images} initialIndex={2} open={true} onClose={vi.fn()} />)
    fireEvent.keyDown(window, { key: "ArrowRight" })
    expect(screen.getByRole("img")).toHaveAttribute("src", "/uploads/img3.jpg")
  })

  it("navigation arrows have correct aria-labels", () => {
    render(<ImageGalleryLightbox images={images} open={true} onClose={vi.fn()} />)
    // Prev should not be present at index 0 (hidden when at first)
    expect(screen.queryByLabelText("lightbox.prev")).not.toBeInTheDocument()
    // Next should be present
    expect(screen.getByLabelText("lightbox.next")).toBeInTheDocument()
  })

  it("backdrop has correct styling", () => {
    render(<ImageGalleryLightbox images={images} open={true} onClose={vi.fn()} />)
    const lightbox = screen.getByTestId("image-lightbox")
    const backdrop = lightbox.querySelector(".bg-black\\/90")
    expect(backdrop).toBeInTheDocument()
    expect(backdrop).toHaveClass("backdrop-blur-[8px]")
  })

  it("closes on backdrop click", () => {
    const onClose = vi.fn()
    render(<ImageGalleryLightbox images={images} open={true} onClose={onClose} />)
    const lightbox = screen.getByTestId("image-lightbox")
    const backdrop = lightbox.querySelector(".bg-black\\/90")
    fireEvent.click(backdrop!)
    expect(onClose).toHaveBeenCalled()
  })

  it("clicking dot navigates to that image", () => {
    render(<ImageGalleryLightbox images={images} open={true} onClose={vi.fn()} />)
    const dots = screen.getAllByRole("button").filter((btn) =>
      btn.classList.contains("h-1.5")
    )
    fireEvent.click(dots[2])
    expect(screen.getByRole("img")).toHaveAttribute("src", "/uploads/img3.jpg")
  })

  it("forwards ref", () => {
    const ref = { current: null as HTMLDivElement | null }
    render(<ImageGalleryLightbox ref={ref} images={images} open={true} onClose={vi.fn()} />)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })
})
