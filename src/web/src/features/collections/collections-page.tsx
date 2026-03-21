import { useState, useEffect, useRef, useCallback, type FormEvent } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import {
  Plus,
  Pencil,
  Trash2,
  Library,
  Search,
  SearchX,
  Upload,
  Loader2,
  ArrowUpDown,
  SlidersHorizontal,
  ExternalLink,
  MoreVertical,
  LayoutGrid,
  List,
  GripVertical,
} from "lucide-react"
import {
  EmptyState,
  PageHeader,
  SkeletonRect,
  StaggerChildren,
  staggerItemVariants,
  springs,
  toast,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  DataTable,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  SortableList,
} from "@/components/ds"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useDebounce } from "@/hooks"

interface CollectionType {
  id: number
  name: string
  icon: string
}

interface Collection {
  id: number
  name: string
  description: string
  coverImage: string | null
  visibility: string
  collectionTypeId: number
  collectionTypeName: string
  itemCount: number
  ownedCount: number
  completionPercentage: number
  createdAt: string
  updatedAt: string | null
}

export default function Collections() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [collections, setCollections] = useState<Collection[]>([])
  const [collectionTypes, setCollectionTypes] = useState<CollectionType[]>([])
  const [loading, setLoading] = useState(true)

  // Search, filter & sort
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [sortBy, setSortBy] = useState<string>(() => localStorage.getItem("collections-sortBy") ?? "sortOrder")
  const [sortDir, setSortDir] = useState<string>(() => localStorage.getItem("collections-sortDir") ?? "asc")

  // View mode (grid/list)
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    const saved = localStorage.getItem("collections-view-mode")
    return saved === "list" ? "list" : "grid"
  })

  // Mobile filter toggle
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formTypeId, setFormTypeId] = useState<number | "">("")
  const [formVisibility, setFormVisibility] = useState("Private")
  const [formCoverFile, setFormCoverFile] = useState<File | null>(null)
  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  // File input ref for dropzone
  const fileInputRef = useRef<HTMLInputElement>(null)

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }

  const fetchCollections = useCallback(async (sort?: { sortBy: string; sortDir: string }) => {
    try {
      const s = sort ?? { sortBy, sortDir }
      const params = new URLSearchParams({ sortBy: s.sortBy, sortDir: s.sortDir })
      const res = await fetch(`/api/collections?${params}`, { headers })
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setCollections(data)
    } catch {
      toast.error(t("collections.fetchError"))
    } finally {
      setLoading(false)
    }
  }, [sortBy, sortDir]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchCollectionTypes() {
    try {
      const res = await fetch("/api/collection-types", { headers })
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setCollectionTypes(data)
    } catch {
      // non-critical, form will show empty select
    }
  }

  useEffect(() => {
    fetchCollections()
    fetchCollectionTypes()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle ?create=true query param
  useEffect(() => {
    if (!loading && searchParams.get("create") === "true") {
      openCreate()
      setSearchParams({}, { replace: true })
    }
  }, [loading]) // eslint-disable-line react-hooks/exhaustive-deps

  // Filtered collections
  const filteredCollections = collections.filter((c) => {
    const matchesSearch =
      !debouncedSearch ||
      c.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchesType =
      filterType === "all" || c.collectionTypeId === Number(filterType)
    return matchesSearch && matchesType
  })

  function getRelativeTime(dateStr: string): string {
    const now = Date.now()
    const then = new Date(dateStr).getTime()
    const diffSec = Math.round((now - then) / 1000)
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
    if (diffSec < 60) return rtf.format(-diffSec, "second")
    const diffMin = Math.round(diffSec / 60)
    if (diffMin < 60) return rtf.format(-diffMin, "minute")
    const diffHr = Math.round(diffMin / 60)
    if (diffHr < 24) return rtf.format(-diffHr, "hour")
    const diffDay = Math.round(diffHr / 24)
    if (diffDay < 30) return rtf.format(-diffDay, "day")
    const diffMonth = Math.round(diffDay / 30)
    if (diffMonth < 12) return rtf.format(-diffMonth, "month")
    return rtf.format(-Math.round(diffDay / 365), "year")
  }

  function getMetadataLine(c: Collection): string {
    const parts: string[] = [t("collections.itemCount", { count: c.itemCount })]
    if (c.itemCount > 0) {
      parts.push(t("collections.complete", { percent: Math.round(c.completionPercentage) }))
    }
    if (c.updatedAt) {
      parts.push(t("collections.updated", { timeAgo: getRelativeTime(c.updatedAt) }))
    }
    return parts.join(" · ")
  }

  function handleSortChange(value: string) {
    // value format: "name:asc", "updatedAt:desc", "itemCount:desc", "createdAt:desc"
    const [newSortBy, newSortDir] = value.split(":")
    setSortBy(newSortBy)
    setSortDir(newSortDir)
    localStorage.setItem("collections-sortBy", newSortBy)
    localStorage.setItem("collections-sortDir", newSortDir)
    fetchCollections({ sortBy: newSortBy, sortDir: newSortDir })
  }

  function toggleViewMode() {
    const next = viewMode === "grid" ? "list" : "grid"
    setViewMode(next)
    localStorage.setItem("collections-view-mode", next)
  }

  const isCustomSort = sortBy === "sortOrder"

  const WARM_GRADIENTS = [
    "linear-gradient(135deg, hsl(var(--accent)/0.20), hsl(var(--chart-3)/0.10))",
    "linear-gradient(135deg, hsl(var(--chart-2)/0.15), hsl(var(--chart-5)/0.10))",
    "linear-gradient(135deg, hsl(var(--chart-4)/0.15), hsl(var(--chart-7)/0.10))",
    "linear-gradient(135deg, hsl(var(--chart-6)/0.15), hsl(var(--accent)/0.08))",
  ]

  /* v8 ignore start -- DnD reorder callback */
  async function handleReorderCollections(newOrder: Collection[]) {
    const previous = collections
    setCollections(newOrder)
    try {
      const res = await fetch("/api/collections/reorder", {
        method: "POST",
        headers,
        body: JSON.stringify({ collectionIds: newOrder.map((c) => c.id) }),
      })
      if (!res.ok) throw new Error("Failed to reorder")
    } catch {
      toast.error(t("collections.reorderFailed"))
      setCollections(previous)
    }
  }
  /* v8 ignore stop */

  function openCreate() {
    setEditingId(null)
    setFormName("")
    setFormDescription("")
    setFormTypeId(collectionTypes.length > 0 ? collectionTypes[0].id : "")
    setFormVisibility("Private")
    setFormCoverFile(null)
    setFormError("")
    setDialogOpen(true)
  }

  function openEdit(c: Collection) {
    setEditingId(c.id)
    setFormName(c.name)
    setFormDescription(c.description)
    setFormTypeId(c.collectionTypeId)
    setFormVisibility("Private")
    setFormCoverFile(null)
    setFormError("")
    setDialogOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError("")

    if (!formName.trim()) {
      setFormError(t("collections.nameRequired"))
      return
    }

    if (!formTypeId) {
      setFormError(t("collections.typeRequired"))
      return
    }

    setSubmitting(true)
    try {
      const body = {
        name: formName.trim(),
        description: formDescription.trim(),
        collectionTypeId: formTypeId,
        visibility: formVisibility,
      }

      /* v8 ignore next 4 */
      const url = editingId
        ? `/api/collections/${editingId}`
        : "/api/collections"
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message ?? t("collections.saveFailed"))
      }

      const saved = await res.json()

      // Upload cover image if selected
      if (formCoverFile) {
        const coverId = editingId ?? saved.id
        const formData = new FormData()
        formData.append("cover", formCoverFile)
        await fetch(`/api/collections/${coverId}/cover`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })
      }

      setDialogOpen(false)
      toast.success(
        editingId
          ? t("collections.saveSuccess")
          : t("collections.createSuccess")
      )
      await fetchCollections()
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : t("collections.saveFailed")
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (deleteId === null) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/collections/${deleteId}`, {
        method: "DELETE",
        headers,
      })
      if (!res.ok) throw new Error("Failed to delete")
      setDeleteId(null)
      toast.success(t("collections.deleteSuccess"))
      await fetchCollections()
    } catch {
      toast.error(t("collections.deleteFailed"))
    } finally {
      setDeleting(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      setFormCoverFile(file)
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader
          title={t("collections.title")}
        />
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="relative overflow-hidden rounded-[var(--radius-xl)] border border-border" style={{ aspectRatio: "4/3" }}>
              <SkeletonRect height="100%" className="w-full rounded-[var(--radius-xl)]" />
              <div className="absolute inset-x-0 bottom-0 px-5 pb-5">
                <SkeletonRect height={20} width="60%" className="opacity-30" />
                <SkeletonRect height={14} width="40%" className="mt-2 opacity-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title={t("collections.title")} />

      {collections.length === 0 ? (
        <EmptyState
          icon={<Library />}
          title={t("emptyStates.collections.title")}
          description={t("emptyStates.collections.description")}
          actionLabel={t("emptyStates.collections.action")}
          onAction={openCreate}
        />
      ) : (
        <>
          {/* Toolbar: search, filters toggle (mobile), type filter, sort, new collection button */}
          <div className="mt-6 flex flex-col gap-3">
            {/* Top row: search + filters toggle (mobile) + new collection button */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:max-w-[420px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("collections.searchPlaceholder")}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="sm:hidden"
                onClick={() => setFiltersOpen((v) => !v)}
                aria-label={t("collections.toolbar.filters")}
              >
                <SlidersHorizontal className="mr-1.5 h-4 w-4" />
                {t("collections.toolbar.filters")}
              </Button>
              {/* Desktop: inline filters */}
              <div className="hidden sm:flex sm:items-center sm:gap-3">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={t("collections.filterByType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("collections.allTypes")}
                    </SelectItem>
                    {collectionTypes.map((ct) => (
                      <SelectItem key={ct.id} value={String(ct.id)}>
                        {ct.icon ? `${ct.icon} ` : ""}
                        {ct.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={`${sortBy}:${sortDir}`} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-[200px]" aria-label={t("collections.toolbar.sortBy")}>
                    <ArrowUpDown className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    <SelectValue placeholder={t("collections.toolbar.sortBy")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sortOrder:asc">{t("collections.sort.customOrder")}</SelectItem>
                    <SelectItem value="name:asc">{t("collections.sort.name")}</SelectItem>
                    <SelectItem value="updatedAt:desc">{t("collections.sort.lastUpdated")}</SelectItem>
                    <SelectItem value="itemCount:desc">{t("collections.sort.mostItems")}</SelectItem>
                    <SelectItem value="createdAt:desc">{t("collections.sort.recentlyAdded")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={toggleViewMode}
                      aria-label={viewMode === "grid" ? t("collections.viewList") : t("collections.viewGrid")}
                    >
                      {viewMode === "grid" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {viewMode === "grid" ? t("collections.viewList") : t("collections.viewGrid")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                onClick={openCreate}
                className="ml-auto bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                {t("collections.create")}
              </Button>
            </div>
            {/* Mobile: collapsible filter row */}
            <div
              className={`grid transition-all duration-200 ease-in-out sm:hidden ${filtersOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
              <div className="overflow-hidden">
                <div className="flex gap-3">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={t("collections.filterByType")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t("collections.allTypes")}
                      </SelectItem>
                      {collectionTypes.map((ct) => (
                        <SelectItem key={ct.id} value={String(ct.id)}>
                          {ct.icon ? `${ct.icon} ` : ""}
                          {ct.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={`${sortBy}:${sortDir}`} onValueChange={handleSortChange}>
                    <SelectTrigger className="flex-1" aria-label={t("collections.toolbar.sortBy")}>
                      <ArrowUpDown className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                      <SelectValue placeholder={t("collections.toolbar.sortBy")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sortOrder:asc">{t("collections.sort.customOrder")}</SelectItem>
                    <SelectItem value="name:asc">{t("collections.sort.name")}</SelectItem>
                      <SelectItem value="updatedAt:desc">{t("collections.sort.lastUpdated")}</SelectItem>
                      <SelectItem value="itemCount:desc">{t("collections.sort.mostItems")}</SelectItem>
                      <SelectItem value="createdAt:desc">{t("collections.sort.recentlyAdded")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Collection cards grid / list */}
          {filteredCollections.length === 0 ? (
            <div className="mt-16 flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <SearchX className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm font-medium text-foreground">{t("collections.noResults")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("collections.noResultsHint")}</p>
            </div>
          ) : viewMode === "grid" ? (
            /* v8 ignore start -- grid view with optional drag-to-reorder */
            isCustomSort ? (
              <SortableList
                items={filteredCollections}
                keyExtractor={(c) => c.id}
                layout="grid"
                gridClassName="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3"
                onReorder={handleReorderCollections}
                renderItem={(c, { dragHandleProps, isDragging }, idx) => (
                  <div
                    className={`group relative cursor-pointer overflow-hidden rounded-[var(--radius-xl)] border border-border shadow-[var(--shadow-sm)] transition-all duration-200 ease-out hover:-translate-y-1 hover:border-[hsl(var(--accent)/0.20)] hover:shadow-[var(--shadow-lg)] ${isDragging ? "scale-[1.02] ring-2 ring-accent shadow-[var(--shadow-xl)] opacity-100" : ""}`}
                    style={{ aspectRatio: "4/3" }}
                    onClick={() => navigate(`/collections/${c.id}`)}
                  >
                    {/* Drag handle */}
                    <button
                      type="button"
                      className="absolute left-3 top-3 z-10 cursor-grab touch-none rounded-[var(--radius-md)] bg-black/40 p-1 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 max-sm:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                      {...dragHandleProps}
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>

                    {c.coverImage ? (
                      <img src={c.coverImage} alt={c.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-[400ms] group-hover:scale-[1.03]" />
                    ) : (
                      <div className="flex h-full items-center justify-center" style={{ background: WARM_GRADIENTS[(idx ?? 0) % 4] }}>
                        <Library className="h-12 w-12 text-muted-foreground/40" />
                      </div>
                    )}

                    {/* Collection type badge — shifted right when drag handle visible */}
                    {c.collectionTypeName && (
                      <span className="absolute left-12 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[12px] font-medium uppercase tracking-[0.05em] text-white backdrop-blur-sm">
                        {c.collectionTypeName}
                      </span>
                    )}

                    {/* Metadata overlay */}
                    <div className="absolute inset-x-0 bottom-0 flex items-end px-5 pb-5 pt-10" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.75))" }}>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-display text-[20px] font-semibold text-white">{c.name}</h3>
                        <p className="text-[14px] text-white/85">{getMetadataLine(c)}</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div
                      className="absolute right-3 top-3 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 max-sm:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50" onClick={() => navigate(`/collections/${c.id}`)} aria-label={t("collections.view")}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50" onClick={() => openEdit(c)} aria-label={t("collections.edit")}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50" aria-label={t("collections.actions")}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(c.id) }}>
                            <Trash2 className="h-4 w-4" />
                            {t("collections.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )}
              />
            ) : (
              <StaggerChildren className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
                {filteredCollections.map((c, idx) => (
                  <motion.div
                    key={c.id}
                    variants={staggerItemVariants}
                    whileHover={{ y: -4, transition: { ...springs.default } }}
                    whileTap={{ y: -2, scale: 0.99, transition: { ...springs.stiff } }}
                    className="group relative cursor-pointer overflow-hidden rounded-[var(--radius-xl)] border border-border shadow-[var(--shadow-sm)] transition-shadow duration-200 hover:border-[hsl(var(--accent)/0.20)] hover:shadow-[var(--shadow-lg)]"
                    style={{ aspectRatio: "4/3" }}
                    onClick={() => navigate(`/collections/${c.id}`)}
                  >
                    {c.coverImage ? (
                      <img src={c.coverImage} alt={c.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-[400ms] group-hover:scale-[1.03]" />
                    ) : (
                      <div className="flex h-full items-center justify-center" style={{ background: WARM_GRADIENTS[idx % 4] }}>
                        <Library className="h-12 w-12 text-muted-foreground/40" />
                      </div>
                    )}

                    {/* Collection type badge */}
                    {c.collectionTypeName && (
                      <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[12px] font-medium uppercase tracking-[0.05em] text-white backdrop-blur-sm">
                        {c.collectionTypeName}
                      </span>
                    )}

                    {/* Metadata overlay */}
                    <div className="absolute inset-x-0 bottom-0 flex items-end px-5 pb-5 pt-10" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.75))" }}>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-display text-[20px] font-semibold text-white">{c.name}</h3>
                        <p className="text-[14px] text-white/85">{getMetadataLine(c)}</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div
                      className="absolute right-3 top-3 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 max-sm:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50" onClick={() => navigate(`/collections/${c.id}`)} aria-label={t("collections.view")}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50" onClick={() => openEdit(c)} aria-label={t("collections.edit")}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50" aria-label={t("collections.actions")}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(c.id) }}>
                            <Trash2 className="h-4 w-4" />
                            {t("collections.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                ))}
              </StaggerChildren>
            )
            /* v8 ignore stop */
          ) : (
            <div className="mt-6">
              <DataTable<Collection>
                columns={[
                  {
                    header: t("collections.nameLabel"),
                    accessor: "name",
                    render: (_value, row) => {
                      const idx = collections.indexOf(row)
                      return (
                        <div className="flex items-center gap-3">
                          {row.coverImage ? (
                            <img
                              src={row.coverImage}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded-[var(--radius-md)] object-cover"
                            />
                          ) : (
                            <div
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)]"
                              style={{ background: WARM_GRADIENTS[(idx >= 0 ? idx : 0) % 4] }}
                            >
                              <Library className="h-4 w-4 text-muted-foreground/40" />
                            </div>
                          )}
                          <span className="truncate text-sm font-medium">{row.name}</span>
                        </div>
                      )
                    },
                  },
                  {
                    header: t("collections.typeLabel"),
                    accessor: "collectionTypeName",
                    className: "hidden md:table-cell",
                  },
                  {
                    header: t("collections.listItems"),
                    accessor: "itemCount",
                    className: "tabular-nums",
                  },
                  {
                    header: t("collections.listUpdated"),
                    accessor: (row) => row.updatedAt ? getRelativeTime(row.updatedAt) : "—",
                    className: "hidden sm:table-cell text-muted-foreground",
                  },
                ]}
                data={filteredCollections}
                onRowClick={(row) => navigate(`/collections/${row.id}`)}
              />
            </div>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)]">
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? t("collections.editTitle")
                : t("collections.createTitle")}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? t("collections.editDescription")
                : t("collections.createDescription")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
                {formError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="col-name">{t("collections.nameLabel")}</Label>
              <Input
                id="col-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t("collections.namePlaceholder")}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="col-description">
                {t("collections.descriptionLabel")}
              </Label>
              <Input
                id="col-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t("collections.descriptionPlaceholder")}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("collections.typeLabel")}</Label>
              <Select
                value={formTypeId ? String(formTypeId) : ""}
                onValueChange={(v) => setFormTypeId(v ? Number(v) : "")}
                disabled={submitting || editingId !== null}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("collections.selectType")} />
                </SelectTrigger>
                <SelectContent>
                  {collectionTypes.map((ct) => (
                    <SelectItem key={ct.id} value={String(ct.id)}>
                      {ct.icon ? `${ct.icon} ` : ""}
                      {ct.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("collections.coverLabel")}</Label>
              {formCoverFile ? (
                <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border p-3">
                  <img
                    src={URL.createObjectURL(formCoverFile)}
                    alt=""
                    className="h-20 w-20 shrink-0 rounded-[var(--radius-md)] object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{formCoverFile.name}</p>
                    <button
                      type="button"
                      className="mt-1 text-sm text-destructive hover:underline"
                      onClick={() => setFormCoverFile(null)}
                    >
                      {t("collections.removeCover")}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  /* v8 ignore next 2 */
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed border-muted-foreground/25 px-6 py-6 text-center transition-colors hover:border-accent/50 hover:bg-accent/5"
                >
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    {t("collections.dropCoverHere")}
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  setFormCoverFile(e.target.files?.[0] ?? null)
                }
                disabled={submitting}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                {t("collections.cancel")}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                )}
                {submitting
                  ? t("collections.saving")
                  : editingId
                    ? t("collections.save")
                    : t("collections.create")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t("collections.deleteTitle")}
        description={t("collections.deleteConfirm")}
        confirmLabel={t("collections.delete")}
        cancelLabel={t("collections.cancel")}
        loadingLabel={t("collections.deleting")}
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
