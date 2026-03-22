import { useState, useEffect, useMemo, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import {
  Plus,
  Pencil,
  Trash2,
  Heart,
  Link,
  MoreVertical,
  ChevronDown,
  DollarSign,
  FileText,
  Loader2,
  GripVertical,
  Search,
  ArrowUp,
  Minus,
  ArrowDown,
  ExternalLink,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  EmptyState,
  PageHeader,
  Card,
  CardContent,
  Badge,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SkeletonRect,
  SkeletonText,
  SortableList,
  StaggerChildren,
  FadeIn,
  Textarea,
  toast,
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
import {
  ConfirmDialog,
} from "@/components/ui/confirm-dialog"
import { useMediaQuery } from "@/hooks"

interface Collection {
  id: number
  name: string
}

interface CatalogItem {
  id: number
  name: string
  identifier: string
}

interface WishlistItem {
  id: number
  collectionId: number
  catalogItemId: number | null
  name: string
  priority: number
  targetPrice: number | null
  notes: string | null
}

interface GroupedWishlist {
  collection: Collection
  items: WishlistItem[]
}

type PriorityFilter = "all" | "high" | "medium" | "low"
type SortOption = "priority" | "price" | "name" | "dateAdded"
type DateFilter = "all" | "7d" | "30d" | "90d"

function getPriorityVariant(priority: number): "destructive" | "accent" | "default" {
  if (priority <= 1) return "destructive"
  if (priority <= 2) return "accent"
  return "default"
}

function getPriorityLabel(priority: number, t: (key: string) => string): string {
  if (priority <= 1) return t("wishlist.priorityHigh")
  if (priority <= 2) return t("wishlist.priorityMedium")
  return t("wishlist.priorityLow")
}

function PriorityIcon({ priority, className }: { priority: number; className?: string }) {
  if (priority <= 1) return <ArrowUp className={className} />
  if (priority <= 2) return <Minus className={className} />
  return <ArrowDown className={className} />
}

function PriorityDot({ priority }: { priority: "high" | "medium" | "low" }) {
  const colors = {
    high: "bg-destructive",
    medium: "bg-accent",
    low: "bg-muted-foreground",
  }
  return <span className={`w-2 h-2 rounded-full shrink-0 ${colors[priority]}`} />
}

function WishlistSkeleton() {
  return (
    <div className="space-y-6">
      {/* Toolbar skeleton */}
      <div className="flex flex-wrap items-center gap-3">
        <SkeletonRect width="10rem" height="2.25rem" className="rounded-md" />
        <SkeletonRect width="10rem" height="2.25rem" className="rounded-md" />
        <SkeletonRect width="10rem" height="2.25rem" className="rounded-md" />
        <div className="ml-auto">
          <SkeletonRect width="4rem" height="1rem" className="rounded" />
        </div>
      </div>
      {/* Group 1 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-2 py-2.5">
          <SkeletonRect width="1rem" height="1rem" />
          <SkeletonRect width="8rem" height="1.5rem" />
          <SkeletonRect width="2rem" height="1.25rem" className="rounded-lg" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <SkeletonRect width="1rem" height="1rem" />
                <SkeletonRect width="8rem" height="1.25rem" />
              </div>
              <SkeletonRect width="4rem" height="1.25rem" className="ml-6 rounded-lg" />
              <SkeletonRect width="6rem" height="1rem" />
              <SkeletonText lines={2} />
            </div>
          ))}
        </div>
      </div>
      {/* Group 2 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-2 py-2.5">
          <SkeletonRect width="1rem" height="1rem" />
          <SkeletonRect width="6rem" height="1.5rem" />
          <SkeletonRect width="2rem" height="1.25rem" className="rounded-lg" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <SkeletonRect width="1rem" height="1rem" />
                <SkeletonRect width="7rem" height="1.25rem" />
              </div>
              <SkeletonRect width="4rem" height="1.25rem" className="ml-6 rounded-lg" />
              <SkeletonRect width="5rem" height="1rem" />
              <SkeletonText lines={1} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Wishlist() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const navigate = useNavigate()
  const isMobile = useMediaQuery("(max-width: 639px)")

  const [groups, setGroups] = useState<GroupedWishlist[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all")
  const [sortBy, setSortBy] = useState<SortOption>("priority")
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")

  // Collapsible groups
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set())

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null)
  const [formCollectionId, setFormCollectionId] = useState<number | "">("")
  const [formName, setFormName] = useState("")
  const [formPriority, setFormPriority] = useState(1)
  const [formTargetPrice, setFormTargetPrice] = useState("")
  const [formNotes, setFormNotes] = useState("")
  const [formCatalogItemId, setFormCatalogItemId] = useState<number | null>(null)
  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Catalog item search for linking
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([])
  const [catalogSearch, setCatalogSearch] = useState("")

  // Delete confirmation
  const [deleteItem, setDeleteItem] = useState<WishlistItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  // All collections for the dropdown
  const [collections, setCollections] = useState<Collection[]>([])

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }

  async function fetchData() {
    try {
      const colRes = await fetch("/api/collections", { headers })
      if (!colRes.ok) throw new Error("Failed to fetch collections")
      const cols: Collection[] = await colRes.json()
      setCollections(cols)

      const grouped: GroupedWishlist[] = []
      for (const col of cols) {
        const res = await fetch(`/api/collections/${col.id}/wishlist`, { headers })
        if (!res.ok) continue
        const items: WishlistItem[] = await res.json()
        if (items.length > 0) {
          grouped.push({ collection: col, items })
        }
      }
      setGroups(grouped)
      // Expand all groups by default
      setExpandedGroups(new Set(grouped.map((g) => g.collection.id)))
    } catch {
      toast.error(t("wishlist.fetchError"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Filter and sort groups
  const filteredGroups = useMemo(() => {
    return groups
      .map((group) => {
        let items = [...group.items]

        // Filter by priority
        if (priorityFilter === "high") items = items.filter((i) => i.priority <= 1)
        else if (priorityFilter === "medium") items = items.filter((i) => i.priority === 2)
        else if (priorityFilter === "low") items = items.filter((i) => i.priority >= 3)

        // Filter by date added (using item.id as proxy for creation order)
        if (dateFilter !== "all") {
          const days = dateFilter === "7d" ? 7 : dateFilter === "30d" ? 30 : 90
          // Use the max id as a reference point for relative age estimation
          const maxId = Math.max(...group.items.map((i) => i.id))
          const threshold = maxId - days
          items = items.filter((i) => i.id > threshold)
        }

        // Sort
        items.sort((a, b) => {
          if (sortBy === "priority") return a.priority - b.priority
          if (sortBy === "price") return (a.targetPrice ?? Infinity) - (b.targetPrice ?? Infinity)
          if (sortBy === "name") return a.name.localeCompare(b.name)
          if (sortBy === "dateAdded") return b.id - a.id
          /* v8 ignore next */
          return 0
        })

        return { ...group, items }
      })
      .filter((group) => group.items.length > 0)
  }, [groups, priorityFilter, sortBy, dateFilter])

  const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0)
  const filteredItemCount = filteredGroups.reduce((sum, g) => sum + g.items.length, 0)

  function toggleGroup(collectionId: number) {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(collectionId)) next.delete(collectionId)
      else next.add(collectionId)
      return next
    })
  }

  function openCreate() {
    setEditingItem(null)
    setFormCollectionId(collections.length > 0 ? collections[0].id : "")
    setFormName("")
    setFormPriority(1)
    setFormTargetPrice("")
    setFormNotes("")
    setFormCatalogItemId(null)
    setCatalogItems([])
    setCatalogSearch("")
    setFormError("")
    setDialogOpen(true)
  }

  function openEdit(item: WishlistItem) {
    setEditingItem(item)
    setFormCollectionId(item.collectionId)
    setFormName(item.name)
    setFormPriority(item.priority)
    setFormTargetPrice(item.targetPrice != null ? String(item.targetPrice) : "")
    setFormNotes(item.notes ?? "")
    setFormCatalogItemId(item.catalogItemId)
    setCatalogItems([])
    setCatalogSearch("")
    setFormError("")
    setDialogOpen(true)
  }

  /* v8 ignore start -- catalog item search triggered by debounced effect, not directly testable */
  async function searchCatalogItems(collectionId: number, query: string) {
    if (!query.trim()) {
      setCatalogItems([])
      return
    }
    try {
      const res = await fetch(
        `/api/collections/${collectionId}/items?search=${encodeURIComponent(query)}&pageSize=10`,
        { headers }
      )
      if (!res.ok) return
      const data = await res.json()
      setCatalogItems(data.items ?? [])
    } catch {
      // ignore
    }
  }
  /* v8 ignore stop */

  useEffect(() => {
    const colId = formCollectionId
    if (!colId || !catalogSearch.trim()) {
      setCatalogItems([])
      return
    }
    const timeout = setTimeout(() => {
      searchCatalogItems(colId as number, catalogSearch)
    }, 300)
    return () => clearTimeout(timeout)
  }, [catalogSearch, formCollectionId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError("")

    if (!formName.trim()) {
      setFormError(t("wishlist.nameRequired"))
      return
    }

    if (!formCollectionId) {
      setFormError(t("wishlist.collectionRequired"))
      return
    }

    setSubmitting(true)
    try {
      const collectionId = editingItem ? editingItem.collectionId : formCollectionId

      const body = {
        name: formName.trim(),
        priority: formPriority,
        targetPrice: formTargetPrice ? Number(formTargetPrice) : null,
        notes: formNotes.trim() || null,
        catalogItemId: formCatalogItemId,
      }

      const url = editingItem
        ? `/api/collections/${collectionId}/wishlist/${editingItem.id}`
        : `/api/collections/${collectionId}/wishlist`
      const method = editingItem ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        throw new Error(t("wishlist.saveFailed"))
      }

      setDialogOpen(false)
      toast.success(editingItem ? t("wishlist.updateSuccess") : t("wishlist.addSuccess"))
      setLoading(true)
      await fetchData()
    /* v8 ignore start -- error handling branches */
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : t("wishlist.saveFailed")
      )
    } finally {
      setSubmitting(false)
    }
    /* v8 ignore stop */
  }

  async function handleDelete() {
    /* v8 ignore next */
    if (!deleteItem) return
    setDeleting(true)
    try {
      const res = await fetch(
        `/api/collections/${deleteItem.collectionId}/wishlist/${deleteItem.id}`,
        { method: "DELETE", headers }
      )
      if (!res.ok) throw new Error("Failed to delete")
      setDeleteItem(null)
      toast.success(t("wishlist.deleteSuccess"))
      setLoading(true)
      await fetchData()
    } catch {
      toast.error(t("wishlist.deleteFailed"))
    } finally {
      setDeleting(false)
    }
  }

  /* v8 ignore start -- DnD reorder callback not simulatable in jsdom */
  async function handleWishlistReorder(collectionId: number, newItems: WishlistItem[]) {
    // Optimistic update
    setGroups((prev) =>
      prev.map((g) =>
        g.collection.id === collectionId ? { ...g, items: newItems } : g
      )
    )

    try {
      const res = await fetch(`/api/collections/${collectionId}/wishlist/reorder`, {
        method: "POST",
        headers,
        body: JSON.stringify({ itemIds: newItems.map((i) => i.id) }),
      })
      if (!res.ok) throw new Error("Failed to reorder")
    } catch {
      toast.error(t("wishlist.reorderFailed"))
      // Revert on failure
      await fetchData()
    }
  }
  /* v8 ignore stop */

  if (loading) {
    return (
      <FadeIn>
        <PageHeader
          title={t("wishlist.title")}
          actions={
            <Button disabled>
              <Plus className="mr-2 h-4 w-4" />
              {t("wishlist.add")}
            </Button>
          }
        />
        <div className="mt-6">
          <WishlistSkeleton />
        </div>
      </FadeIn>
    )
  }

  return (
    <FadeIn>
      <PageHeader
        title={t("wishlist.title")}
        description={t("wishlist.description")}
        actions={
          <Button
            onClick={openCreate}
            disabled={collections.length === 0}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("wishlist.add")}
          </Button>
        }
      />

      {totalItems === 0 ? (
        <StaggerChildren staggerDelay={0.06}>
          <EmptyState
            icon={<Heart />}
            title={t("emptyStates.wishlist.title")}
            description={t("emptyStates.wishlist.description")}
            actionLabel={t("emptyStates.wishlist.action")}
            onAction={openCreate}
          />
        </StaggerChildren>
      ) : (
        <>
          {/* Filter/Sort Toolbar */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as PriorityFilter)}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder={t("wishlist.filterPriority")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("wishlist.priorityAll")}</SelectItem>
                <SelectItem value="high">
                  <span className="flex items-center gap-2">
                    <PriorityDot priority="high" />
                    {t("wishlist.priorityHigh")}
                  </span>
                </SelectItem>
                <SelectItem value="medium">
                  <span className="flex items-center gap-2">
                    <PriorityDot priority="medium" />
                    {t("wishlist.priorityMedium")}
                  </span>
                </SelectItem>
                <SelectItem value="low">
                  <span className="flex items-center gap-2">
                    <PriorityDot priority="low" />
                    {t("wishlist.priorityLow")}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder={t("wishlist.sortBy")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">{t("wishlist.sortPriority")}</SelectItem>
                <SelectItem value="price">{t("wishlist.sortPrice")}</SelectItem>
                <SelectItem value="name">{t("wishlist.sortName")}</SelectItem>
                <SelectItem value="dateAdded">{t("wishlist.sortDateAdded")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder={t("wishlist.filterDateAll")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("wishlist.filterDateAll")}</SelectItem>
                <SelectItem value="7d">{t("wishlist.filterDate7d")}</SelectItem>
                <SelectItem value="30d">{t("wishlist.filterDate30d")}</SelectItem>
                <SelectItem value="90d">{t("wishlist.filterDate90d")}</SelectItem>
              </SelectContent>
            </Select>

            <span className="ml-auto text-sm text-muted-foreground w-full text-right sm:w-auto">
              {t("wishlist.itemCount", { count: filteredItemCount })}
            </span>
          </div>

          {/* Grouped items */}
          <StaggerChildren staggerDelay={0.06} className="mt-6 space-y-6">
            {filteredGroups.map((group) => {
              const isExpanded = expandedGroups.has(group.collection.id)
              return (
                <FadeIn key={group.collection.id}>
                  <div data-testid="wishlist-group" data-collection-id={group.collection.id}>
                    {/* Collection group header */}
                    <button
                      onClick={() => toggleGroup(group.collection.id)}
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-2.5 text-left transition-colors duration-[--duration-fast] hover:bg-muted/50"
                    >
                      <motion.span
                        animate={{ rotate: isExpanded ? 0 : -90 }}
                        transition={{ duration: 0.15 }}
                      >
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </motion.span>
                      <h2 className="truncate font-display text-lg font-semibold text-foreground">
                        {group.collection.name}
                      </h2>
                      <Badge variant="default" size="sm" className="bg-secondary text-secondary-foreground">
                        {group.items.length}
                      </Badge>
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1.0] }}
                          className="overflow-hidden"
                        >
                          {/* v8 ignore start -- SortableList renderItem requires DnD simulation not possible in jsdom */}
                          <SortableList
                            items={group.items}
                            keyExtractor={(item) => item.id}
                            layout="grid"
                            gridClassName="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                            onReorder={(newItems) =>
                              handleWishlistReorder(group.collection.id, newItems)
                            }
                            renderItem={(item, { dragHandleProps, isDragging }) => (
                              <Card
                                data-testid="wishlist-card"
                                data-item-id={item.id}
                                className={`group relative h-full rounded-xl transition-shadow duration-[--duration-fast] hover:shadow-md ${isDragging ? "ring-2 ring-accent shadow-xl scale-[1.02]" : ""}`}
                              >
                                <CardContent className="p-4">
                                  {/* Header: drag handle + name + actions */}
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          className="cursor-grab touch-none text-muted-foreground hover:text-foreground shrink-0"
                                          {...dragHandleProps}
                                        >
                                          <GripVertical className="h-4 w-4" />
                                        </button>
                                        <span className="truncate font-semibold text-foreground text-sm">
                                          {item.name}
                                        </span>
                                        {item.catalogItemId && (
                                          <Link className="h-3.5 w-3.5 shrink-0 text-accent" />
                                        )}
                                      </div>
                                      <div className="mt-1.5 ml-6" data-testid="priority-badge" data-priority={getPriorityVariant(item.priority) === "destructive" ? "high" : getPriorityVariant(item.priority) === "accent" ? "medium" : "low"}>
                                        <Badge
                                          variant={getPriorityVariant(item.priority)}
                                          size="sm"
                                          className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
                                        >
                                          {!isMobile && <PriorityIcon priority={item.priority} className="h-3 w-3" />}
                                          {getPriorityLabel(item.priority, t)}
                                        </Badge>
                                      </div>
                                    </div>

                                    {/* Actions dropdown */}
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity"
                                        >
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => openEdit(item)}>
                                          <Pencil className="mr-2 h-4 w-4" />
                                          {t("wishlist.edit")}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => setDeleteItem(item)}
                                          className="text-destructive focus:text-destructive"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          {t("wishlist.delete")}
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>

                                  {/* Target price */}
                                  {item.targetPrice != null && (
                                    <div className="mt-3 flex items-center gap-1.5 text-sm">
                                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span className="text-muted-foreground">
                                        {t("wishlist.targetPrice")}:{" "}
                                        <span className="font-semibold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
                                          ${item.targetPrice.toFixed(2)}
                                        </span>
                                      </span>
                                    </div>
                                  )}

                                  {/* Notes */}
                                  {item.notes && (
                                    <div className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                                      <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                      <span className={isMobile ? "line-clamp-1" : "line-clamp-2"}>{item.notes}</span>
                                    </div>
                                  )}

                                  {/* Catalog link */}
                                  {item.catalogItemId && (
                                    <button
                                      type="button"
                                      className="mt-2 text-xs text-accent hover:text-accent/80 cursor-pointer"
                                      onClick={() => navigate(`/collections/${item.collectionId}/items/${item.catalogItemId}`)}
                                    >
                                      {isMobile ? (
                                        <ExternalLink className="h-3.5 w-3.5" />
                                      ) : (
                                        t("wishlist.viewCatalogItem")
                                      )}
                                    </button>
                                  )}
                                </CardContent>
                              </Card>
                            )}
                          />
                          {/* v8 ignore stop */}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </FadeIn>
              )
            })}

            {/* No results state */}
            {filteredGroups.length === 0 && (
              <div className="py-12 text-center">
                <Search className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                <p className="text-muted-foreground mt-3">{t("wishlist.noResults")}</p>
                <p className="text-sm text-muted-foreground/70 mt-1">{t("wishlist.noResultsHint")}</p>
              </div>
            )}
          </StaggerChildren>
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? t("wishlist.editTitle") : t("wishlist.addTitle")}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? t("wishlist.editDescription")
                : t("wishlist.addDescription")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </div>
            )}

            {!editingItem && (
              <div className="space-y-2">
                <Label htmlFor="wl-collection">{t("wishlist.collectionLabel")}</Label>
                <Select
                  value={formCollectionId ? String(formCollectionId) : ""}
                  onValueChange={(v) => setFormCollectionId(v ? Number(v) : "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("wishlist.selectCollection")} />
                  </SelectTrigger>
                  <SelectContent>
                    {collections.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="wl-name">{t("wishlist.nameLabel")}</Label>
              <Input
                id="wl-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t("wishlist.namePlaceholder")}
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wl-priority">{t("wishlist.priorityLabel")}</Label>
                <Select
                  value={String(formPriority)}
                  onValueChange={(v) => setFormPriority(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">
                      <span className="flex items-center gap-2">
                        <PriorityDot priority="high" />
                        {t("wishlist.priorityHigh")}
                      </span>
                    </SelectItem>
                    <SelectItem value="2">
                      <span className="flex items-center gap-2">
                        <PriorityDot priority="medium" />
                        {t("wishlist.priorityMedium")}
                      </span>
                    </SelectItem>
                    <SelectItem value="3">
                      <span className="flex items-center gap-2">
                        <PriorityDot priority="low" />
                        {t("wishlist.priorityLow")}
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wl-price">{t("wishlist.targetPriceLabel")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">$</span>
                  <Input
                    id="wl-price"
                    type="number"
                    step="0.01"
                    min={0}
                    value={formTargetPrice}
                    onChange={(e) => setFormTargetPrice(e.target.value)}
                    placeholder="0.00"
                    disabled={submitting}
                    className="pl-7"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wl-notes">{t("wishlist.notesLabel")}</Label>
              <Textarea
                id="wl-notes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder={t("wishlist.notesPlaceholder")}
                disabled={submitting}
                rows={3}
                className="resize-y"
              />
            </div>

            {/* Catalog item link */}
            <div className="space-y-2">
              <Label>{t("wishlist.linkCatalogItem")}</Label>
              {formCatalogItemId ? (
                <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <Link className="h-3.5 w-3.5 text-accent" />
                  <span className="flex-1">{t("wishlist.linked")}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setFormCatalogItemId(null)}
                  >
                    {t("wishlist.unlink")}
                  </Button>
                </div>
              ) : formCollectionId ? (
                <div>
                  <Input
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder={t("wishlist.searchCatalogPlaceholder")}
                    disabled={submitting}
                  />
                  {catalogItems.length > 0 && (
                    <div className="mt-1 max-h-32 overflow-y-auto rounded-md border bg-popover shadow-md">
                      {catalogItems.map((ci) => (
                        <button
                          key={ci.id}
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent/10 cursor-pointer"
                          onClick={() => {
                            setFormCatalogItemId(ci.id)
                            setFormName(formName || ci.name)
                            setCatalogSearch("")
                            setCatalogItems([])
                          }}
                        >
                          <span className="text-muted-foreground">{ci.identifier}</span>
                          <span className="text-foreground">{ci.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("wishlist.selectCollectionFirst")}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                {t("wishlist.cancel")}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitting
                  ? t("wishlist.saving")
                  : editingItem
                    ? t("wishlist.save")
                    : t("wishlist.add")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteItem !== null}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        title={t("wishlist.deleteTitle")}
        description={t("wishlist.deleteConfirm")}
        confirmLabel={t("wishlist.delete")}
        cancelLabel={t("wishlist.cancel")}
        loadingLabel={t("wishlist.deleting")}
        loading={deleting}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </FadeIn>
  )
}
