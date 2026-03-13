import { useState } from "react"
import { NavLink, Outlet } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  LayoutDashboard,
  Library,
  Heart,
  User,
  Menu,
  Moon,
  Sun,
  Languages,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/collections", labelKey: "nav.collections", icon: Library },
  { to: "/wishlist", labelKey: "nav.wishlist", icon: Heart },
  { to: "/profile", labelKey: "nav.profile", icon: User },
] as const

function NavLinks({ onClick }: { onClick?: () => void }) {
  const { t } = useTranslation()
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          onClick={onClick}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )
          }
        >
          <item.icon className="h-4 w-4" />
          {t(item.labelKey)}
        </NavLink>
      ))}
    </nav>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={t("nav.toggleTheme")}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}

function LanguageToggle() {
  const { i18n } = useTranslation()

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "pt" ? "en" : "pt")
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      aria-label={i18n.language === "pt" ? "English" : "Português"}
      title={i18n.language === "pt" ? "English" : "Português"}
    >
      <Languages className="h-4 w-4" />
    </Button>
  )
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar-background md:block">
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center border-b px-4">
            <span className="text-lg font-bold text-sidebar-foreground">
              GeekVault
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <NavLinks />
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4">
          {/* Mobile menu button */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-14 items-center border-b px-4 pt-0">
                <span className="text-lg font-bold">GeekVault</span>
              </div>
              <div className="p-4">
                <NavLinks onClick={() => setSidebarOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          {/* Mobile logo */}
          <span className="text-lg font-bold md:hidden">GeekVault</span>

          <div className="ml-auto flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
