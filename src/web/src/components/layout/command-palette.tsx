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
  PanelLeftClose,
  Languages,
} from "lucide-react"
import { useTheme } from "@/components/theme-provider"

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()

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

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      label={t("commandPalette.label")}
      overlayClassName="fixed inset-0 bg-black/50 z-50"
      contentClassName="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background shadow-2xl sm:w-full"
    >
      <CommandInput
        placeholder={t("commandPalette.placeholder")}
        className="flex h-12 w-full border-b border-border bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground"
      />
      <CommandList className="max-h-80 overflow-y-auto p-2">
        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
          {t("commandPalette.noResults")}
        </CommandEmpty>

        <CommandGroup
          heading={t("commandPalette.navigation")}
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground"
        >
          <CommandItem
            value="dashboard"
            onSelect={() => runCommand(() => navigate("/"))}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm min-h-[44px] aria-selected:bg-accent/10 aria-selected:text-accent-foreground"
          >
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            {t("nav.dashboard")}
          </CommandItem>
          <CommandItem
            value="collections"
            onSelect={() => runCommand(() => navigate("/collections"))}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm min-h-[44px] aria-selected:bg-accent/10 aria-selected:text-accent-foreground"
          >
            <Library className="h-4 w-4 text-muted-foreground" />
            {t("nav.collections")}
          </CommandItem>
          <CommandItem
            value="collection-types"
            onSelect={() => runCommand(() => navigate("/collection-types"))}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm min-h-[44px] aria-selected:bg-accent/10 aria-selected:text-accent-foreground"
          >
            <Layers className="h-4 w-4 text-muted-foreground" />
            {t("nav.collectionTypes")}
          </CommandItem>
          <CommandItem
            value="wishlist"
            onSelect={() => runCommand(() => navigate("/wishlist"))}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm min-h-[44px] aria-selected:bg-accent/10 aria-selected:text-accent-foreground"
          >
            <Heart className="h-4 w-4 text-muted-foreground" />
            {t("nav.wishlist")}
          </CommandItem>
          <CommandItem
            value="profile"
            onSelect={() => runCommand(() => navigate("/profile"))}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm min-h-[44px] aria-selected:bg-accent/10 aria-selected:text-accent-foreground"
          >
            <User className="h-4 w-4 text-muted-foreground" />
            {t("nav.profile")}
          </CommandItem>
        </CommandGroup>

        <CommandSeparator className="mx-2 my-1 h-px bg-border" />

        <CommandGroup
          heading={t("commandPalette.actions")}
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground"
        >
          <CommandItem
            value="create-collection"
            onSelect={() =>
              runCommand(() => navigate("/collections?create=true"))
            }
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm min-h-[44px] aria-selected:bg-accent/10 aria-selected:text-accent-foreground"
          >
            <Plus className="h-4 w-4 text-muted-foreground" />
            {t("commandPalette.createCollection")}
          </CommandItem>
          <CommandItem
            value="toggle-theme"
            onSelect={() =>
              runCommand(() => setTheme(theme === "dark" ? "light" : "dark"))
            }
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm min-h-[44px] aria-selected:bg-accent/10 aria-selected:text-accent-foreground"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Moon className="h-4 w-4 text-muted-foreground" />
            )}
            {t("commandPalette.toggleTheme")}
          </CommandItem>
          <CommandItem
            value="toggle-sidebar"
            onSelect={() =>
              runCommand(() =>
                window.dispatchEvent(new Event("toggle-sidebar"))
              )
            }
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm min-h-[44px] aria-selected:bg-accent/10 aria-selected:text-accent-foreground"
          >
            <PanelLeftClose className="h-4 w-4 text-muted-foreground" />
            {t("commandPalette.toggleSidebar")}
          </CommandItem>
          <CommandItem
            value="change-language"
            onSelect={() =>
              runCommand(() =>
                i18n.changeLanguage(i18n.language === "en" ? "pt" : "en")
              )
            }
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm min-h-[44px] aria-selected:bg-accent/10 aria-selected:text-accent-foreground"
          >
            <Languages className="h-4 w-4 text-muted-foreground" />
            {t("commandPalette.changeLanguage")}
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
