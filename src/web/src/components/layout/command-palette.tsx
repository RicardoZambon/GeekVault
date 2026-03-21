import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "cmdk"
import {
  LayoutDashboard,
  Library,
  Layers,
  Heart,
  User,
  Plus,
  Sun,
  Moon,
  Monitor,
  PanelLeftClose,
  Languages,
  Search,
  SearchX,
  Upload,
  Clock,
} from "lucide-react"
import { useTheme } from "@/components/theme-provider"

interface RecentPage {
  path: string
  label: string
  timestamp: number
}

const RECENT_PAGES_KEY = "geekvault-recent-pages"

function getRecentPages(): RecentPage[] {
  try {
    const stored = sessionStorage.getItem(RECENT_PAGES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "now"
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  return `${hours}h`
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()
  const [recentPages, setRecentPages] = useState<RecentPage[]>([])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  useEffect(() => {
    if (open) {
      setRecentPages(getRecentPages())
    }
  }, [open])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  const groupHeadingClass =
    "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground"

  const itemClass =
    "flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm min-h-[44px] transition-colors duration-[50ms] aria-selected:bg-accent/10 aria-selected:text-accent-foreground [&[aria-selected=true]_svg]:text-accent"

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      label={t("commandPalette.label")}
      overlayClassName="fixed inset-0 bg-[rgba(28,25,23,0.4)] dark:bg-black/60 backdrop-blur-[8px] z-50"
      contentClassName="fixed left-1/2 top-[25%] z-50 w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 rounded-[var(--radius-xl)] border border-border bg-popover shadow-[var(--shadow-xl)] overflow-hidden"
    >
      <div className="flex items-center border-b border-border px-4">
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
        <CommandInput
          placeholder={t("commandPalette.placeholder")}
          className="flex h-[52px] w-full bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground"
        />
      </div>
      <CommandList className="max-h-[min(360px,calc(70vh-52px-36px))] overflow-y-auto p-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40">
        <CommandEmpty className="flex flex-col items-center justify-center py-10 gap-2">
          <SearchX className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {t("commandPalette.noResults")}
          </p>
          <p className="text-xs text-muted-foreground/70">
            {t("commandPalette.noResultsHint")}
          </p>
        </CommandEmpty>

        {/* Recent Items — only when palette has no search query */}
        {recentPages.length > 0 && (
          <CommandGroup
            heading={t("commandPalette.recent")}
            className={groupHeadingClass}
          >
            {recentPages.map((page) => (
              <CommandItem
                key={page.path}
                value={`recent ${page.label} ${page.path}`}
                onSelect={() => runCommand(() => navigate(page.path))}
                className={itemClass}
              >
                <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 min-w-0 truncate font-medium">{page.label}</span>
                <span className="shrink-0 ml-auto text-xs text-muted-foreground">
                  {formatRelativeTime(page.timestamp)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {recentPages.length > 0 && (
          <CommandSeparator className="mx-2 my-1 h-px bg-border" />
        )}

        <CommandGroup
          heading={t("commandPalette.navigation")}
          className={groupHeadingClass}
        >
          <CommandItem
            value="dashboard home overview"
            onSelect={() => runCommand(() => navigate("/"))}
            className={itemClass}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 min-w-0 truncate font-medium">{t("nav.dashboard")}</span>
          </CommandItem>
          <CommandItem
            value="collections library"
            onSelect={() => runCommand(() => navigate("/collections"))}
            className={itemClass}
          >
            <Library className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 min-w-0 truncate font-medium">{t("nav.collections")}</span>
          </CommandItem>
          <CommandItem
            value="collection types categories"
            onSelect={() => runCommand(() => navigate("/collection-types"))}
            className={itemClass}
          >
            <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 min-w-0 truncate font-medium">{t("nav.collectionTypes")}</span>
          </CommandItem>
          <CommandItem
            value="wishlist favorites"
            onSelect={() => runCommand(() => navigate("/wishlist"))}
            className={itemClass}
          >
            <Heart className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 min-w-0 truncate font-medium">{t("nav.wishlist")}</span>
          </CommandItem>
          <CommandItem
            value="profile account settings"
            onSelect={() => runCommand(() => navigate("/profile"))}
            className={itemClass}
          >
            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 min-w-0 truncate font-medium">{t("nav.profile")}</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator className="mx-2 my-1 h-px bg-border" />

        <CommandGroup
          heading={t("commandPalette.actions")}
          className={groupHeadingClass}
        >
          <CommandItem
            value="create collection new add"
            onSelect={() =>
              runCommand(() => navigate("/collections?create=true"))
            }
            className={itemClass}
          >
            <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 min-w-0 truncate font-medium">{t("commandPalette.createCollection")}</span>
          </CommandItem>
          <CommandItem
            value="import data upload csv"
            onSelect={() =>
              runCommand(() => navigate("/collections?import=true"))
            }
            className={itemClass}
          >
            <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 min-w-0 truncate font-medium">{t("commandPalette.importData")}</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator className="mx-2 my-1 h-px bg-border" />

        <CommandGroup
          heading={t("commandPalette.settings")}
          className={groupHeadingClass}
        >
          {/* v8 ignore start -- theme/language ternary branches depend on mocked state */}
          <CommandItem
            value="toggle theme dark light mode appearance"
            onSelect={() =>
              runCommand(() => {
                if (theme === "light") setTheme("dark")
                else if (theme === "dark") setTheme("system")
                else setTheme("light")
              })
            }
            className={itemClass}
          >
            {theme === "dark" ? (
              <Moon className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : theme === "system" ? (
              <Monitor className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <Sun className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="flex-1 min-w-0 truncate font-medium">{t("commandPalette.toggleTheme")}</span>
            <span className="shrink-0 ml-auto text-xs text-muted-foreground">
              {t(`nav.userMenu.theme.${theme === "dark" ? "dark" : theme === "system" ? "system" : "light"}`)}
            </span>
          </CommandItem>
          <CommandItem
            value="toggle sidebar panel collapse"
            onSelect={() =>
              runCommand(() =>
                window.dispatchEvent(new Event("toggle-sidebar"))
              )
            }
            className={itemClass}
          >
            <PanelLeftClose className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 min-w-0 truncate font-medium">{t("commandPalette.toggleSidebar")}</span>
          </CommandItem>
          <CommandItem
            value="change language english portuguese locale"
            onSelect={() =>
              runCommand(() =>
                i18n.changeLanguage(i18n.language === "en" ? "pt" : "en")
              )
            }
            className={itemClass}
          >
            <Languages className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 min-w-0 truncate font-medium">{t("commandPalette.changeLanguage")}</span>
            <span className="shrink-0 ml-auto text-xs text-muted-foreground">
              {i18n.language === "en" ? "English" : "Português"}
            </span>
          </CommandItem>
          {/* v8 ignore stop */}
        </CommandGroup>
      </CommandList>

      {/* Footer hint bar — hidden on mobile */}
      <div className="hidden sm:flex items-center gap-4 border-t border-border bg-muted/50 px-4 h-9">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
          <kbd className="bg-background border border-border rounded px-1 py-0.5 text-[10px] font-mono">↑↓</kbd>
          {t("commandPalette.hintNavigate")}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
          <kbd className="bg-background border border-border rounded px-1 py-0.5 text-[10px] font-mono">↵</kbd>
          {t("commandPalette.hintSelect")}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
          <kbd className="bg-background border border-border rounded px-1 py-0.5 text-[10px] font-mono">esc</kbd>
          {t("commandPalette.hintDismiss")}
        </span>
      </div>
    </CommandDialog>
  )
}
