import { useTranslation } from "react-i18next"
import { Search, HelpCircle, Bell, Languages, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { useAuth } from "@/components/auth-provider"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ds"
import { UserMenu } from "./user-menu"

const isMac = navigator.platform.toUpperCase().includes("MAC")

function openCommandPalette() {
  document.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "k",
      metaKey: isMac,
      ctrlKey: !isMac,
      bubbles: true,
    })
  )
}

export function TopToolbar() {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "pt" ? "en" : "pt")
  }

  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?"

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

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side icons */}
      <div className="flex items-center gap-1">
        {/* Help */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t("toolbar.help")}>
              <HelpCircle className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("toolbar.helpComingSoon")}</TooltipContent>
        </Tooltip>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t("toolbar.notifications")}>
              <Bell className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled className="text-muted-foreground">
              {t("toolbar.noNotifications")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Language toggle */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLanguage}
              aria-label={i18n.language === "pt" ? "English" : "Português"}
            >
              <Languages className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {i18n.language === "pt" ? "English" : "Português"}
          </TooltipContent>
        </Tooltip>

        {/* Theme toggle */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={t("nav.toggleTheme")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("nav.toggleTheme")}</TooltipContent>
        </Tooltip>

        {/* User menu */}
        <UserMenu side="bottom" align="end">
          <Button variant="ghost" size="icon" className="ml-1" aria-label={t("toolbar.userMenu")}>
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {initials}
              </div>
            )}
          </Button>
        </UserMenu>
      </div>
    </div>
  )
}
