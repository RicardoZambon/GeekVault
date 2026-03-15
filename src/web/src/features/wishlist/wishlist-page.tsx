import { useState, useEffect, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Pencil, Trash2, Heart, Link } from "lucide-react"
import { EmptyState } from "@/components/ds"
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

export default function Wishlist() {
  const { t } = useTranslation()
  const { token } = useAuth()

  const [groups, setGroups] = useState<GroupedWishlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

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
    } catch {
      setError(t("wishlist.fetchError"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
      setLoading(true)
      await fetchData()
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : t("wishlist.saveFailed")
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteItem) return
    setDeleting(true)
    try {
      const res = await fetch(
        `/api/collections/${deleteItem.collectionId}/wishlist/${deleteItem.id}`,
        { method: "DELETE", headers }
      )
      if (!res.ok) throw new Error("Failed to delete")
      setDeleteItem(null)
      setLoading(true)
      await fetchData()
    } catch {
      setError(t("wishlist.deleteFailed"))
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0)

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("wishlist.title")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t("wishlist.description")}
          </p>
        </div>
        <Button onClick={openCreate} disabled={collections.length === 0}>
          <Plus className="h-4 w-4" />
          {t("wishlist.add")}
        </Button>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
          {error}
        </div>
      )}

      {totalItems === 0 ? (
        <EmptyState
          icon={<Heart />}
          title={t("emptyStates.wishlist.title")}
          description={t("emptyStates.wishlist.description")}
          actionLabel={t("emptyStates.wishlist.action")}
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <div className="mt-6 space-y-8">
          {groups.map((group) => (
            <div key={group.collection.id}>
              <h2 className="mb-3 text-lg font-semibold text-foreground">
                {group.collection.name}
              </h2>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {item.priority}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{item.name}</span>
                        {item.catalogItemId && (
                          <Link className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-3 text-sm text-muted-foreground">
                        {item.targetPrice != null && (
                          <span>{t("wishlist.targetPrice")}: ${item.targetPrice.toFixed(2)}</span>
                        )}
                        {item.notes && (
                          <span className="truncate">{item.notes}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(item)}
                        aria-label={t("wishlist.edit")}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteItem(item)}
                        aria-label={t("wishlist.delete")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
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
                <select
                  id="wl-collection"
                  value={formCollectionId}
                  onChange={(e) =>
                    setFormCollectionId(e.target.value ? Number(e.target.value) : "")
                  }
                  disabled={submitting}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                >
                  <option value="">{t("wishlist.selectCollection")}</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
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
                <Input
                  id="wl-priority"
                  type="number"
                  min={1}
                  value={formPriority}
                  onChange={(e) => setFormPriority(Number(e.target.value) || 1)}
                  disabled={submitting}
                />
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
                  <Link className="h-3.5 w-3.5 text-muted-foreground" />
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
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent"
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
      <Dialog
        open={deleteItem !== null}
        onOpenChange={(open) => !open && setDeleteItem(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("wishlist.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("wishlist.deleteConfirm")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteItem(null)}
              disabled={deleting}
            >
              {t("wishlist.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? t("wishlist.deleting") : t("wishlist.delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
