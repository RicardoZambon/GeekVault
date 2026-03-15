import { useState, useEffect } from "react"
import { NavLink } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  LayoutDashboard,
  Library,
  Layers,
  Heart,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ds"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks"
import { UserMenu } from "./user-menu"
import logoFull from "@/assets/logo-full.png"
import vaultIcon from "@/assets/vault-icon.png"

const STORAGE_KEY = "geekvault-sidebar-collapsed"

interface NavItem {
  to: string
  labelKey: string
  icon: typeof LayoutDashboard
}

interface NavGroup {
  labelKey: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    labelKey: "nav.groups.overview",
    items: [
      { to: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
    ],
  },
  {
    labelKey: "nav.groups.collections",
    items: [
      { to: "/collections", labelKey: "nav.collections", icon: Library },
      { to: "/collection-types", labelKey: "nav.collectionTypes", icon: Layers },
      { to: "/wishlist", labelKey: "nav.wishlist", icon: Heart },
    ],
  },
  {
    labelKey: "nav.groups.account",
    items: [
      { to: "/profile", labelKey: "nav.profile", icon: User },
    ],
  },
]

function getDefaultCollapsed(isDesktop: boolean): boolean {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored !== null) return stored === "true"
  // Default: expanded on desktop (>=1024px), collapsed on tablet
  return !isDesktop
}

export function Sidebar() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const [collapsed, setCollapsed] = useState(() => getDefaultCollapsed(isDesktop))

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed))
  }, [collapsed])

  useEffect(() => {
    const handler = () => setCollapsed((prev) => !prev)
    window.addEventListener("toggle-sidebar", handler)
    return () => window.removeEventListener("toggle-sidebar", handler)
  }, [])

  const toggleCollapsed = () => setCollapsed((prev) => !prev)

  // Get initials for avatar
  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?"

  return (
    <aside
      className={cn(
        "group/sidebar relative hidden shrink-0 bg-sidebar-background md:flex flex-col transition-all duration-250 ease-in-out",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-[72px] items-center border-b border-sidebar-border",
          collapsed ? "justify-center px-2" : "gap-3 px-4"
        )}
      >
        <img src={vaultIcon} alt="GeekVault" className="h-8 w-8 shrink-0 object-contain" />
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-display text-base font-bold text-sidebar-foreground">
              GeekVault
            </span>
            <span className="text-xs text-sidebar-foreground/50">
              {t("app.tagline")}
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        <div className="flex flex-col gap-4">
          {navGroups.map((group, groupIndex) => (
            <div key={group.labelKey} className="flex flex-col gap-1">
              {collapsed ? (
                groupIndex > 0 && (
                  <div className="mx-3 border-t border-sidebar-border" />
                )
              ) : (
                <span className="px-3 pb-1 text-xs font-semibold uppercase text-sidebar-foreground/50">
                  {t(group.labelKey)}
                </span>
              )}
              {group.items.map((item) => {
                const link = (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center rounded-lg text-sm font-medium transition-colors relative min-h-[44px]",
                        collapsed ? "justify-center px-2" : "gap-3 px-3",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-[3px] border-sidebar-primary"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-sidebar-primary")} />
                        {!collapsed && <span>{t(item.labelKey)}</span>}
                      </>
                    )}
                  </NavLink>
                )

                if (collapsed) {
                  return (
                    <Tooltip key={item.to} delayDuration={0}>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right">{t(item.labelKey)}</TooltipContent>
                    </Tooltip>
                  )
                }

                return link
              })}
            </div>
          ))}
        </div>
      </nav>

      {/* User section */}
      <div className="border-t border-sidebar-border p-2">
        <UserMenu side="top" align="start">
          <button
            className={cn(
              "flex w-full items-center rounded-lg py-2 transition-colors hover:bg-sidebar-accent/50",
              collapsed ? "justify-center px-2" : "gap-3 px-2"
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
              {initials}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0 text-left">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {user?.displayName}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/50">
                  {user?.email}
                </p>
              </div>
            )}
          </button>
        </UserMenu>
      </div>

      {/* Edge collapse toggle */}
      <button
        onClick={toggleCollapsed}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar-background text-sidebar-foreground/50 opacity-0 transition-opacity hover:text-sidebar-foreground group-hover/sidebar:opacity-100"
        aria-label={collapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </aside>
  )
}

/** Mobile sidebar content — always expanded, used inside Sheet */
export function MobileSidebarContent({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const { user } = useAuth()

  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?"

  return (
    <div className="flex h-full flex-col bg-sidebar-background">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <img src={logoFull} alt="GeekVault" className="h-8 object-contain" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-4">
          {navGroups.map((group) => (
            <div key={group.labelKey} className="flex flex-col gap-1">
              <span className="px-3 pb-1 text-xs font-semibold uppercase text-sidebar-foreground/50">
                {t(group.labelKey)}
              </span>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors min-h-[44px]",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-[3px] border-sidebar-primary"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={cn("h-5 w-5", isActive && "text-sidebar-primary")} />
                      {t(item.labelKey)}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </div>
      </nav>

      {/* User section */}
      <div className="border-t border-sidebar-border p-4">
        <UserMenu side="top" align="start">
          <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-sidebar-accent/50">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
              {initials}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user?.displayName}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/50">
                {user?.email}
              </p>
            </div>
          </button>
        </UserMenu>
      </div>
    </div>
  )
}
