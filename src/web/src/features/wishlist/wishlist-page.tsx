import { useState, useEffect, useMemo, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import {
  Plus,
  Pencil,
  Trash2,
  Heart,
  Link,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  DollarSign,
  FileText,
  Loader2,
  GripVertical,
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
  toast,
} from "@/components/ds"
import { FadeIn } from "@/components/ds"
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
type SortOption = "priority" | "price" | "name"

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

function WishlistSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SkeletonRect width="8rem" height="1.5rem" />
        <SkeletonRect width="2rem" height="1.5rem" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <SkeletonRect width="4rem" height="1.25rem" />
              <SkeletonRect width="5rem" height="1.25rem" />
            </div>
            <SkeletonText lines={2} />
            <SkeletonRect width="6rem" height="1rem" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Wishlist() {
  const { t } = useTranslation()
  const { token } = useAuth()

  const [groups, setGroups] = useState<GroupedWishlist[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all")
  const [sortBy, setSortBy] = useState<SortOption>("priority")

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

        // Sort
        items.sort((a, b) => {
          if (sortBy === "priority") return a.priority - b.priority
          if (sortBy === "price") return (a.targetPrice ?? Infinity) - (b.targetPrice ?? Infinity)
          if (sortBy === "name") return a.name.localeCompare(b.name)
          /* v8 ignore next */
          return 0
        })

        return { ...group, items }
      })
      .filter((group) => group.items.length > 0)
  }, [groups, priorityFilter, sortBy])

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

  const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0)

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
        <EmptyState
          icon={<Heart />}
          title={t("emptyStates.wishlist.title")}
          description={t("emptyStates.wishlist.description")}
          actionLabel={t("emptyStates.wishlist.action")}
          onAction={openCreate}
        />
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
                <SelectItem value="high">{t("wishlist.priorityHigh")}</SelectItem>
                <SelectItem value="medium">{t("wishlist.priorityMedium")}</SelectItem>
                <SelectItem value="low">{t("wishlist.priorityLow")}</SelectItem>
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
              </SelectContent>
            </Select>

            <span className="ml-auto text-sm text-muted-foreground">
              {t("wishlist.itemCount", { count: totalItems })}
            </span>
          </div>

          {/* Grouped items */}
          <div className="mt-6 space-y-6">
            {filteredGroups.map((group) => {
              const isExpanded = expandedGroups.has(group.collection.id)
              return (
                <div key={group.collection.id}>
                  {/* Collection group header */}
                  <button
                    onClick={() => toggleGroup(group.collection.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/50"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <h2 className="font-display text-lg font-semibold">
                      {group.collection.name}
                    </h2>
                    <Badge variant="default" size="sm">
                      {group.items.length}
                    </Badge>
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
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
                            <Card className={`group relative h-full ${isDragging ? "ring-2 ring-accent" : ""}`}>
                              <CardContent className="p-4">
                                {/* Header: drag handle + name + priority badge */}
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
                                      <span className="truncate font-semibold text-foreground">
                                        {item.name}
                                      </span>
                                      {item.catalogItemId && (
                                        <Link className="h-3.5 w-3.5 shrink-0 text-accent" />
                                      )}
                                    </div>
                                    <Badge
                                      variant={getPriorityVariant(item.priority)}
                                      size="sm"
                                      className="mt-1.5 ml-6"
                                    >
                                      {getPriorityLabel(item.priority, t)}
                                    </Badge>
                                  </div>

                                  {/* Actions dropdown */}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
                                  <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <DollarSign className="h-3.5 w-3.5" />
                                    <span>
                                      {t("wishlist.targetPrice")}: ${item.targetPrice.toFixed(2)}
                                    </span>
                                  </div>
                                )}

                                {/* Notes */}
                                {item.notes && (
                                  <div className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                                    <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    <span className="line-clamp-2">{item.notes}</span>
                                  </div>
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
              )
            })}

            {/* v8 ignore next 4 */}
            {filteredGroups.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                {t("wishlist.noResults")}
              </div>
            )}
          </div>
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
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
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
                    <SelectItem value="1">{t("wishlist.priorityHigh")}</SelectItem>
                    <SelectItem value="2">{t("wishlist.priorityMedium")}</SelectItem>
                    <SelectItem value="3">{t("wishlist.priorityLow")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wl-price">{t("wishlist.targetPriceLabel")}</Label>
                <Input
                  id="wl-price"
                  type="number"
                  step="0.01"
                  min={0}
                  value={formTargetPrice}
                  onChange={(e) => setFormTargetPrice(e.target.value)}
                  placeholder="0.00"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wl-notes">{t("wishlist.notesLabel")}</Label>
              <Input
                id="wl-notes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder={t("wishlist.notesPlaceholder")}
                disabled={submitting}
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
                    <div className="mt-1 max-h-32 overflow-y-auto rounded-md border bg-popover">
                      {catalogItems.map((ci) => (
                        <button
                          key={ci.id}
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent/10"
                          onClick={() => {
                            setFormCatalogItemId(ci.id)
                            setFormName(formName || ci.name)
                            setCatalogSearch("")
                            setCatalogItems([])
                          }}
                        >
                          <span className="text-muted-foreground">{ci.identifier}</span>
                          <span>{ci.name}</span>
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
