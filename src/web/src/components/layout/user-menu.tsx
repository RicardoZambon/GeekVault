import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { User, Settings, HelpCircle, LogOut, Globe, Sun, Moon, Monitor } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useTheme } from "@/components/theme-provider"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ds"

interface UserMenuProps {
  children: React.ReactNode
  side?: "right" | "top" | "bottom" | "left"
  align?: "start" | "center" | "end"
}

const themeOrder = ["light", "dark", "system"] as const
const themeIcons = { light: Sun, dark: Moon, system: Monitor } as const

export function UserMenu({ children, side = "right", align = "end" }: UserMenuProps) {
  const { t } = useTranslation()
  const { i18n } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  const cycleTheme = () => {
    const currentIndex = themeOrder.indexOf(theme)
    const next = themeOrder[(currentIndex + 1) % themeOrder.length]
    setTheme(next)
  }

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "pt" ? "en" : "pt")
  }

  const ThemeIcon = themeIcons[theme]
  const themeLabel = t(`nav.userMenu.theme.${theme}`)
  const languageLabel = i18n.language === "pt" ? "Português" : "English"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        side={side}
        align={align}
        className="w-56 bg-popover shadow-lg rounded-[var(--radius-lg)]"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">{user?.displayName}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="min-h-[36px]"
          onClick={() => navigate("/profile")}
        >
          <User className="h-4 w-4 text-muted-foreground" />
          {t("nav.userMenu.profile")}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled
          className="min-h-[36px] opacity-50 cursor-not-allowed"
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
          {t("nav.userMenu.settings")}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled
          className="min-h-[36px] opacity-50 cursor-not-allowed"
        >
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
          {t("nav.userMenu.help")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="min-h-[36px]"
          onSelect={(e) => {
            e.preventDefault()
            toggleLanguage()
          }}
        >
          <Globe className="h-4 w-4 text-muted-foreground" />
          {t("nav.userMenu.language")}: {languageLabel}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="min-h-[36px]"
          onSelect={(e) => {
            e.preventDefault()
            cycleTheme()
          }}
        >
          <ThemeIcon className="h-4 w-4 text-muted-foreground" />
          {t("nav.userMenu.themeLabel")}: {themeLabel}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="min-h-[36px] text-destructive focus:text-destructive focus:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {t("nav.userMenu.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
