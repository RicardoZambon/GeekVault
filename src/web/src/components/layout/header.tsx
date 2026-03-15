import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Menu, Moon, Sun, Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useTheme } from "@/components/theme-provider"
import { MobileSidebarContent } from "./sidebar"
import vaultIcon from "@/assets/vault-icon.png"

export function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const { t, i18n } = useTranslation()

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "pt" ? "en" : "pt")
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
      {/* Mobile menu button */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 bg-sidebar-background border-sidebar-border [&>button]:text-sidebar-foreground">
          <MobileSidebarContent onClose={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Mobile logo */}
      <div className="flex items-center gap-2">
        <img src={vaultIcon} alt="GeekVault" className="h-7 w-7 object-contain" />
        <span className="text-lg font-bold font-display">GeekVault</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLanguage}
          aria-label={i18n.language === "pt" ? "English" : "Português"}
          title={i18n.language === "pt" ? "English" : "Português"}
        >
          <Languages className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label={t("nav.toggleTheme")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </div>
    </header>
  )
}
