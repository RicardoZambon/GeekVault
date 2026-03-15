import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { User, Settings, HelpCircle, LogOut } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
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

export function UserMenu({ children, side = "right", align = "end" }: UserMenuProps) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent side={side} align={align} className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">{user?.displayName}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <User className="h-4 w-4" />
          {t("nav.userMenu.profile")}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled
          className="opacity-50 cursor-not-allowed"
        >
          <Settings className="h-4 w-4" />
          {t("nav.userMenu.settings")}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled
          className="opacity-50 cursor-not-allowed"
        >
          <HelpCircle className="h-4 w-4" />
          {t("nav.userMenu.help")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          {t("nav.userMenu.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
