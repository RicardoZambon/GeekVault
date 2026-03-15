import { useTranslation } from "react-i18next"
import { Search } from "lucide-react"

function openCommandPalette() {
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
  )
}

export function TopToolbar() {
  const { t } = useTranslation()
  const isMac = navigator.platform.toUpperCase().includes("MAC")

  return (
    <div className="hidden h-[72px] items-center border-b border-border px-6 md:flex">
      {/* Search trigger */}
      <button
        onClick={openCommandPalette}
        className="flex h-9 w-[280px] items-center gap-2 rounded-lg border border-input bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{t("toolbar.search")}</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
          {isMac ? "⌘" : "Ctrl+"}K
        </kbd>
      </button>

      {/* Right side — help, notifications, language, theme, user menu added in US-013 */}
      <div className="flex-1" />
    </div>
  )
}
