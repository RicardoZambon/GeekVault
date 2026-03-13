import { useState, useEffect, useCallback, type FormEvent } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Plus, ArrowLeft, Image, Package, Check, Trash2, Pencil, Search, CheckCircle2, Circle } from "lucide-react"
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

interface CustomFieldDefinition {
  name: string
  type: string
  required: boolean
  options: string[]
}

interface CollectionTypeDetail {
  id: number
  name: string
  description: string | null
  icon: string | null
  customFields: CustomFieldDefinition[]
}

interface Collection {
  id: number
  name: string
  description: string | null
  coverImage: string | null
  visibility: string
  collectionTypeId: number
  itemCount: number
}

interface CustomFieldValue {
  name: string
  value: string
}

interface CatalogItem {
  id: number
  collectionId: number
  identifier: string
  name: string
  description: string | null
  releaseDate: string | null
  manufacturer: string | null
  referenceCode: string | null
  image: string | null
  rarity: string | null
  customFieldValues: CustomFieldValue[]
  ownedCopies: null
}

interface PaginatedResponse {
  items: CatalogItem[]
  totalCount: number
  page: number
  pageSize: number
}

interface SetSummary {
  id: number
  collectionId: number
  name: string
  expectedItemCount: number
  completedCount: number | null
  completionPercentage: number | null
}

interface SetItem {
  id: number
  setId: number
  catalogItemId: number | null
  name: string
  sortOrder: number
}

interface SetDetail {
  id: number
  collectionId: number
  name: string
  expectedItemCount: number
  completedCount: number | null
  completionPercentage: number | null
  items: SetItem[]
}

export default function CollectionDetail() {
  const { id } = useParams()
  const { t } = useTranslation()
  const { token } = useAuth()
  const navigate = useNavigate()

  const [collection, setCollection] = useState<Collection | null>(null)
  const [collectionType, setCollectionType] = useState<CollectionTypeDetail | null>(null)
  const [items, setItems] = useState<CatalogItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [ownedItemIds, setOwnedItemIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Tab state
  const [activeTab, setActiveTab] = useState<"items" | "sets">("items")

  // Add item dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formIdentifier, setFormIdentifier] = useState("")
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formReleaseDate, setFormReleaseDate] = useState("")
  const [formManufacturer, setFormManufacturer] = useState("")
  const [formReferenceCode, setFormReferenceCode] = useState("")
  const [formImage, setFormImage] = useState("")
  const [formRarity, setFormRarity] = useState("")
  const [formCustomFields, setFormCustomFields] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Sets state
  const [sets, setSets] = useState<SetSummary[]>([])
  const [selectedSet, setSelectedSet] = useState<SetDetail | null>(null)
  const [setsDialogOpen, setSetsDialogOpen] = useState(false)
  const [editingSet, setEditingSet] = useState<SetSummary | null>(null)
  const [setsFormName, setSetsFormName] = useState("")
  const [setsFormError, setSetsFormError] = useState("")
  const [setsSubmitting, setSetsSubmitting] = useState(false)
  const [deleteSetDialogOpen, setDeleteSetDialogOpen] = useState(false)
  const [deletingSetId, setDeletingSetId] = useState<number | null>(null)
  const [setsDeleting, setSetsDeleting] = useState(false)

  // Add items to set
  const [addItemsDialogOpen, setAddItemsDialogOpen] = useState(false)
  const [itemSearchQuery, setItemSearchQuery] = useState("")
  const [newItemName, setNewItemName] = useState("")
  const [addItemSubmitting, setAddItemSubmitting] = useState(false)

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }

  const fetchCollection = useCallback(async () => {
    try {
      const res = await fetch(`/api/collections/${id}`, { headers })
      if (!res.ok) throw new Error("Not found")
      const data = await res.json()
      setCollection(data)
      return data as Collection
    } catch {
      setError(t("collectionDetail.fetchError"))
      return null
    }
  }, [id, token]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCollectionType = useCallback(async (typeId: number) => {
    try {
      const res = await fetch(`/api/collection-types/${typeId}`, { headers })
      if (!res.ok) return
      const data = await res.json()
      setCollectionType(data)
    } catch {
      // non-critical
    }
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`/api/collections/${id}/items?pageSize=100`, { headers })
      if (!res.ok) throw new Error("Failed to fetch items")
      const data: PaginatedResponse = await res.json()
      setItems(data.items)
      setTotalCount(data.totalCount)

      // Determine which items are owned by checking for owned copies
      const owned = new Set<number>()
      for (const item of data.items) {
        const copyRes = await fetch(`/api/items/${item.id}/copies`, { headers })
        if (copyRes.ok) {
          const copies = await copyRes.json()
          if (Array.isArray(copies) && copies.length > 0) {
            owned.add(item.id)
          }
        }
      }
      setOwnedItemIds(owned)
    } catch {
      setError(t("collectionDetail.fetchError"))
    }
  }, [id, token]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSets = useCallback(async () => {
    try {
      const res = await fetch(`/api/collections/${id}/sets`, { headers })
      if (!res.ok) return
      const data: SetSummary[] = await res.json()
      setSets(data)
    } catch {
      // non-critical
    }
  }, [id, token]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSetDetail = useCallback(async (setId: number) => {
    try {
      const res = await fetch(`/api/collections/${id}/sets/${setId}`, { headers })
      if (!res.ok) return
      const data: SetDetail = await res.json()
      setSelectedSet(data)
    } catch {
      // non-critical
    }
  }, [id, token]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    async function load() {
      setLoading(true)
      const col = await fetchCollection()
      if (col) {
        await Promise.all([fetchCollectionType(col.collectionTypeId), fetchItems(), fetchSets()])
      }
      setLoading(false)
    }
    load()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  function openAddItem() {
    setFormIdentifier("")
    setFormName("")
    setFormDescription("")
    setFormReleaseDate("")
    setFormManufacturer("")
    setFormReferenceCode("")
    setFormImage("")
    setFormRarity("")
    setFormCustomFields({})
    setFormError("")
    setDialogOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError("")

    if (!formIdentifier.trim()) {
      setFormError(t("collectionDetail.identifierRequired"))
      return
    }
    if (!formName.trim()) {
      setFormError(t("collectionDetail.nameRequired"))
      return
    }

    // Validate required custom fields
    if (collectionType) {
      for (const field of collectionType.customFields) {
        if (field.required && !formCustomFields[field.name]?.trim()) {
          setFormError(t("collectionDetail.customFieldRequired", { name: field.name }))
          return
        }
      }
    }

    setSubmitting(true)
    try {
      const customFieldValues = Object.entries(formCustomFields)
        .filter(([, v]) => v.trim() !== "")
        .map(([name, value]) => ({ name, value: value.trim() }))

      const body = {
        identifier: formIdentifier.trim(),
        name: formName.trim(),
        description: formDescription.trim() || null,
        releaseDate: formReleaseDate || null,
        manufacturer: formManufacturer.trim() || null,
        referenceCode: formReferenceCode.trim() || null,
        image: formImage.trim() || null,
        rarity: formRarity.trim() || null,
        customFieldValues: customFieldValues.length > 0 ? customFieldValues : null,
      }

      const res = await fetch(`/api/collections/${id}/items`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message ?? t("collectionDetail.saveFailed"))
      }

      setDialogOpen(false)
      await fetchItems()
      await fetchCollection()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t("collectionDetail.saveFailed"))
    } finally {
      setSubmitting(false)
    }
  }

  // --- Set CRUD ---
  function openCreateSet() {
    setEditingSet(null)
    setSetsFormName("")
    setSetsFormError("")
    setSetsDialogOpen(true)
  }

  function openEditSet(s: SetSummary) {
    setEditingSet(s)
    setSetsFormName(s.name)
    setSetsFormError("")
    setSetsDialogOpen(true)
  }

  async function handleSetSubmit(e: FormEvent) {
    e.preventDefault()
    setSetsFormError("")

    if (!setsFormName.trim()) {
      setSetsFormError(t("sets.nameRequired"))
      return
    }

    setSetsSubmitting(true)
    try {
      const url = editingSet
        ? `/api/collections/${id}/sets/${editingSet.id}`
        : `/api/collections/${id}/sets`
      const method = editingSet ? "PUT" : "POST"

      const body = { name: setsFormName.trim() }
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message ?? t("sets.saveFailed"))
      }

      setSetsDialogOpen(false)
      await fetchSets()
      if (editingSet && selectedSet?.id === editingSet.id) {
        await fetchSetDetail(editingSet.id)
      }
    } catch (err) {
      setSetsFormError(err instanceof Error ? err.message : t("sets.saveFailed"))
    } finally {
      setSetsSubmitting(false)
    }
  }

  function confirmDeleteSet(setId: number) {
    setDeletingSetId(setId)
    setDeleteSetDialogOpen(true)
  }

  async function handleDeleteSet() {
    if (!deletingSetId) return
    setSetsDeleting(true)
    try {
      const res = await fetch(`/api/collections/${id}/sets/${deletingSetId}`, {
        method: "DELETE",
        headers,
      })
      if (!res.ok) throw new Error(t("sets.deleteFailed"))
      setDeleteSetDialogOpen(false)
      if (selectedSet?.id === deletingSetId) setSelectedSet(null)
      await fetchSets()
    } catch {
      // show error inline if needed
    } finally {
      setSetsDeleting(false)
      setDeletingSetId(null)
    }
  }

  async function handleAddCatalogItemToSet(catalogItemId: number, itemName: string) {
    if (!selectedSet) return
    setAddItemSubmitting(true)
    try {
      const res = await fetch(`/api/collections/${id}/sets/${selectedSet.id}/items`, {
        method: "POST",
        headers,
        body: JSON.stringify([{ catalogItemId, name: itemName, sortOrder: (selectedSet.items?.length ?? 0) + 1 }]),
      })
      if (!res.ok) throw new Error("Failed to add item")
      await fetchSetDetail(selectedSet.id)
      await fetchSets()
    } catch {
      // non-critical
    } finally {
      setAddItemSubmitting(false)
    }
  }

  async function handleAddNamedItemToSet() {
    if (!selectedSet || !newItemName.trim()) return
    setAddItemSubmitting(true)
    try {
      const res = await fetch(`/api/collections/${id}/sets/${selectedSet.id}/items`, {
        method: "POST",
        headers,
        body: JSON.stringify([{ name: newItemName.trim(), sortOrder: (selectedSet.items?.length ?? 0) + 1 }]),
      })
      if (!res.ok) throw new Error("Failed to add item")
      setNewItemName("")
      await fetchSetDetail(selectedSet.id)
      await fetchSets()
    } catch {
      // non-critical
    } finally {
      setAddItemSubmitting(false)
    }
  }

  // Filter catalog items for the search in add-items dialog
  const filteredCatalogItems = items.filter((item) => {
    if (!itemSearchQuery.trim()) return true
    const q = itemSearchQuery.toLowerCase()
    return item.name.toLowerCase().includes(q) || item.identifier.toLowerCase().includes(q)
  })

  // Determine which set items are "owned" (linked catalog item has owned copies)
  function isSetItemOwned(setItem: SetItem): boolean {
    if (!setItem.catalogItemId) return false
    return ownedItemIds.has(setItem.catalogItemId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("collectionDetail.notFound")}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/collections")}>
          <ArrowLeft className="h-4 w-4" />
          {t("collectionDetail.backToCollections")}
        </Button>
      </div>
    )
  }

  return (
    <div>
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => navigate("/collections")}
      >
        <ArrowLeft className="h-4 w-4" />
        {t("collectionDetail.backToCollections")}
      </Button>

      {/* Collection header */}
      <div className="overflow-hidden rounded-lg border bg-card">
        {collection.coverImage ? (
          <div className="relative h-48 sm:h-56">
            <img
              src={collection.coverImage}
              alt={collection.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 text-white">
              <h1 className="text-2xl font-bold tracking-tight">{collection.name}</h1>
              {collection.description && (
                <p className="mt-1 text-sm text-white/80">{collection.description}</p>
              )}
              <p className="mt-2 text-xs text-white/60">
                {collectionType?.name} · {t("collections.itemCount", { count: totalCount })}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <h1 className="text-2xl font-bold tracking-tight">{collection.name}</h1>
            {collection.description && (
              <p className="mt-1 text-sm text-muted-foreground">{collection.description}</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {collectionType?.name} · {t("collections.itemCount", { count: totalCount })}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
          {error}
        </div>
      )}

      {/* Tab switcher */}
      <div className="mt-6 flex border-b">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "items"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("items")}
        >
          {t("collectionDetail.catalogItems")}
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "sets"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("sets")}
        >
          {t("sets.title")} ({sets.length})
        </button>
      </div>

      {/* Items Tab */}
      {activeTab === "items" && (
        <>
          {/* Toolbar */}
          <div className="mt-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("collectionDetail.catalogItems")}</h2>
            <Button onClick={openAddItem}>
              <Plus className="h-4 w-4" />
              {t("collectionDetail.addItem")}
            </Button>
          </div>

          {/* Gallery grid */}
          {items.length === 0 ? (
            <div className="mt-12 text-center text-muted-foreground">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-3">{t("collectionDetail.emptyItems")}</p>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {items.map((item) => {
                const isOwned = ownedItemIds.has(item.id)
                return (
                  <div
                    key={item.id}
                    className={`group relative cursor-pointer overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md ${
                      isOwned ? "ring-2 ring-green-500/50" : "opacity-75"
                    }`}
                    onClick={() => navigate(`/collections/${id}/items/${item.id}`)}
                  >
                    {/* Item image */}
                    <div className="relative aspect-square bg-muted">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Image className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                      )}
                      {/* Owned badge */}
                      {isOwned && (
                        <div className="absolute top-2 right-2 rounded-full bg-green-500 p-1 text-white shadow-sm">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </div>

                    {/* Item info */}
                    <div className="p-2">
                      <h3 className="truncate text-sm font-medium">{item.name}</h3>
                      {item.rarity && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {item.rarity}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs text-muted-foreground/70">
                        {item.identifier}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Sets Tab */}
      {activeTab === "sets" && (
        <div className="mt-4">
          {/* Sets toolbar */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("sets.title")}</h2>
            <Button onClick={openCreateSet}>
              <Plus className="h-4 w-4" />
              {t("sets.create")}
            </Button>
          </div>

          {sets.length === 0 && !selectedSet ? (
            <div className="mt-12 text-center text-muted-foreground">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-3">{t("sets.empty")}</p>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {/* Sets list */}
              <div className="space-y-2 md:col-span-1">
                {sets.map((s) => {
                  const pct = s.completionPercentage ?? 0
                  const isSelected = selectedSet?.id === s.id
                  return (
                    <div
                      key={s.id}
                      className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                        isSelected ? "border-primary bg-primary/5" : "bg-card hover:bg-muted/50"
                      }`}
                      onClick={() => fetchSetDetail(s.id)}
                    >
                      <div className="flex items-start justify-between">
                        <h3 className="text-sm font-medium">{s.name}</h3>
                        <div className="flex gap-1">
                          <button
                            className="rounded p-1 text-muted-foreground hover:text-foreground"
                            onClick={(e) => { e.stopPropagation(); openEditSet(s) }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className="rounded p-1 text-muted-foreground hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); confirmDeleteSet(s.id) }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {s.completedCount ?? 0} / {s.expectedItemCount} {t("sets.completed")}
                      </p>
                      {/* Progress bar */}
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct >= 100 ? "bg-green-500" : pct > 0 ? "bg-primary" : "bg-muted-foreground/20"
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-right text-xs text-muted-foreground">
                        {pct.toFixed(0)}%
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Set detail panel */}
              <div className="md:col-span-2">
                {selectedSet ? (
                  <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{selectedSet.name}</h3>
                      <Button size="sm" onClick={() => setAddItemsDialogOpen(true)}>
                        <Plus className="h-4 w-4" />
                        {t("sets.addItems")}
                      </Button>
                    </div>

                    {/* Progress */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {selectedSet.completedCount ?? 0} / {selectedSet.expectedItemCount} {t("sets.completed")}
                        </span>
                        <span className="font-medium">
                          {(selectedSet.completionPercentage ?? 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${
                            (selectedSet.completionPercentage ?? 0) >= 100 ? "bg-green-500" : "bg-primary"
                          }`}
                          style={{ width: `${Math.min(selectedSet.completionPercentage ?? 0, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Set items list */}
                    {selectedSet.items && selectedSet.items.length > 0 ? (
                      <ul className="mt-4 space-y-1">
                        {selectedSet.items
                          .sort((a, b) => a.sortOrder - b.sortOrder)
                          .map((si) => {
                            const owned = isSetItemOwned(si)
                            return (
                              <li
                                key={si.id}
                                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                              >
                                {owned ? (
                                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                                ) : (
                                  <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                                )}
                                <span className={owned ? "text-foreground" : "text-muted-foreground"}>
                                  {si.name}
                                </span>
                                {si.catalogItemId && (
                                  <button
                                    className="ml-auto text-xs text-primary hover:underline"
                                    onClick={() => navigate(`/collections/${id}/items/${si.catalogItemId}`)}
                                  >
                                    {t("sets.viewItem")}
                                  </button>
                                )}
                              </li>
                            )
                          })}
                      </ul>
                    ) : (
                      <p className="mt-4 text-center text-sm text-muted-foreground">
                        {t("sets.emptyItems")}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-lg border bg-card p-8">
                    <p className="text-sm text-muted-foreground">{t("sets.selectSet")}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Item Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("collectionDetail.addItemTitle")}</DialogTitle>
            <DialogDescription>{t("collectionDetail.addItemDescription")}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
                {formError}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="item-identifier">{t("collectionDetail.identifierLabel")}</Label>
                <Input
                  id="item-identifier"
                  value={formIdentifier}
                  onChange={(e) => setFormIdentifier(e.target.value)}
                  placeholder={t("collectionDetail.identifierPlaceholder")}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-name">{t("collectionDetail.nameLabel")}</Label>
                <Input
                  id="item-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={t("collectionDetail.namePlaceholder")}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-description">{t("collectionDetail.descriptionLabel")}</Label>
              <Input
                id="item-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t("collectionDetail.descriptionPlaceholder")}
                disabled={submitting}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="item-manufacturer">{t("collectionDetail.manufacturerLabel")}</Label>
                <Input
                  id="item-manufacturer"
                  value={formManufacturer}
                  onChange={(e) => setFormManufacturer(e.target.value)}
                  placeholder={t("collectionDetail.manufacturerPlaceholder")}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-release-date">{t("collectionDetail.releaseDateLabel")}</Label>
                <Input
                  id="item-release-date"
                  type="date"
                  value={formReleaseDate}
                  onChange={(e) => setFormReleaseDate(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="item-reference-code">{t("collectionDetail.referenceCodeLabel")}</Label>
                <Input
                  id="item-reference-code"
                  value={formReferenceCode}
                  onChange={(e) => setFormReferenceCode(e.target.value)}
                  placeholder={t("collectionDetail.referenceCodePlaceholder")}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-rarity">{t("collectionDetail.rarityLabel")}</Label>
                <Input
                  id="item-rarity"
                  value={formRarity}
                  onChange={(e) => setFormRarity(e.target.value)}
                  placeholder={t("collectionDetail.rarityPlaceholder")}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-image">{t("collectionDetail.imageLabel")}</Label>
              <Input
                id="item-image"
                value={formImage}
                onChange={(e) => setFormImage(e.target.value)}
                placeholder={t("collectionDetail.imagePlaceholder")}
                disabled={submitting}
              />
            </div>

            {/* Custom fields based on collection type schema */}
            {collectionType && collectionType.customFields.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">{t("collectionDetail.customFields")}</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {collectionType.customFields.map((field) => (
                    <div key={field.name} className="space-y-1">
                      <Label className="text-xs">
                        {field.name}
                        {field.required && <span className="ml-1 text-destructive">*</span>}
                      </Label>
                      {field.type === "enum" && field.options ? (
                        <select
                          value={formCustomFields[field.name] ?? ""}
                          onChange={(e) =>
                            setFormCustomFields((prev) => ({
                              ...prev,
                              [field.name]: e.target.value,
                            }))
                          }
                          disabled={submitting}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="">--</option>
                          {field.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "boolean" ? (
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={formCustomFields[field.name] === "true"}
                            onChange={(e) =>
                              setFormCustomFields((prev) => ({
                                ...prev,
                                [field.name]: e.target.checked ? "true" : "false",
                              }))
                            }
                            disabled={submitting}
                            className="h-4 w-4 rounded border-input"
                          />
                          {field.name}
                        </label>
                      ) : (
                        <Input
                          type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                          value={formCustomFields[field.name] ?? ""}
                          onChange={(e) =>
                            setFormCustomFields((prev) => ({
                              ...prev,
                              [field.name]: e.target.value,
                            }))
                          }
                          disabled={submitting}
                          className="h-8 text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                {t("collectionDetail.cancel")}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? t("collectionDetail.saving") : t("collectionDetail.addItem")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Set Dialog */}
      <Dialog open={setsDialogOpen} onOpenChange={setSetsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSet ? t("sets.editTitle") : t("sets.createTitle")}</DialogTitle>
            <DialogDescription>
              {editingSet ? t("sets.editDescription") : t("sets.createDescription")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSetSubmit} className="space-y-4">
            {setsFormError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
                {setsFormError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="set-name">{t("sets.nameLabel")}</Label>
              <Input
                id="set-name"
                value={setsFormName}
                onChange={(e) => setSetsFormName(e.target.value)}
                placeholder={t("sets.namePlaceholder")}
                disabled={setsSubmitting}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setSetsDialogOpen(false)} disabled={setsSubmitting}>
                {t("sets.cancel")}
              </Button>
              <Button type="submit" disabled={setsSubmitting}>
                {setsSubmitting ? t("sets.saving") : t("sets.save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Set Confirmation Dialog */}
      <Dialog open={deleteSetDialogOpen} onOpenChange={setDeleteSetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("sets.deleteTitle")}</DialogTitle>
            <DialogDescription>{t("sets.deleteConfirm")}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteSetDialogOpen(false)} disabled={setsDeleting}>
              {t("sets.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteSet} disabled={setsDeleting}>
              {setsDeleting ? t("sets.deleting") : t("sets.delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Items to Set Dialog */}
      <Dialog open={addItemsDialogOpen} onOpenChange={setAddItemsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("sets.addItemsTitle")}</DialogTitle>
            <DialogDescription>{t("sets.addItemsDescription")}</DialogDescription>
          </DialogHeader>

          {/* Search existing catalog items */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t("sets.searchCatalogItems")}</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder={t("sets.searchPlaceholder")}
                value={itemSearchQuery}
                onChange={(e) => setItemSearchQuery(e.target.value)}
              />
            </div>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {filteredCatalogItems.map((item) => {
                const alreadyInSet = selectedSet?.items?.some((si) => si.catalogItemId === item.id)
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                  >
                    <span className="truncate">
                      {item.name}
                      <span className="ml-2 text-xs text-muted-foreground">{item.identifier}</span>
                    </span>
                    {alreadyInSet ? (
                      <span className="text-xs text-muted-foreground">{t("sets.alreadyAdded")}</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        disabled={addItemSubmitting}
                        onClick={() => handleAddCatalogItemToSet(item.id, item.name)}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        {t("sets.add")}
                      </Button>
                    )}
                  </div>
                )
              })}
              {filteredCatalogItems.length === 0 && (
                <p className="py-2 text-center text-sm text-muted-foreground">
                  {t("sets.noItemsFound")}
                </p>
              )}
            </div>
          </div>

          {/* Add by name */}
          <div className="space-y-2 border-t pt-3">
            <Label className="text-sm font-medium">{t("sets.addByName")}</Label>
            <div className="flex gap-2">
              <Input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={t("sets.addByNamePlaceholder")}
                disabled={addItemSubmitting}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddNamedItemToSet()
                  }
                }}
              />
              <Button
                size="sm"
                disabled={addItemSubmitting || !newItemName.trim()}
                onClick={handleAddNamedItemToSet}
              >
                {t("sets.add")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
