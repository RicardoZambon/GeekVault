import { useState, useEffect, useCallback, type FormEvent } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, ArrowLeft, Image, Package, Check, Trash2, Pencil, Search, CheckCircle2, Circle, ArrowUp, ArrowDown, Download, Upload, LayoutGrid, List, ChevronDown, GripVertical } from "lucide-react"
import { ImportWizard } from "./components/import-wizard"
import {
  EmptyState,
  PageHeader,
  Badge,
  Card,
  CardContent,
  DataTable,
  SkeletonRect,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  toast,
  SortableList,
} from "@/components/ds"
import type { DataTableColumn } from "@/components/ds"
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
  const [searchParams, setSearchParams] = useSearchParams()

  const [collection, setCollection] = useState<Collection | null>(null)
  const [collectionType, setCollectionType] = useState<CollectionTypeDetail | null>(null)
  const [items, setItems] = useState<CatalogItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [ownedItemIds, setOwnedItemIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Tab state
  const [activeTab, setActiveTab] = useState<"items" | "sets">("items")

  // View toggle state (grid/table), persisted per collection
  const viewKey = `geekvault-view-${id}`
  const [viewMode, setViewMode] = useState<"grid" | "table">(() => {
    const stored = localStorage.getItem(viewKey)
    return stored === "table" ? "table" : "grid"
  })
  function changeViewMode(mode: "grid" | "table") {
    setViewMode(mode)
    localStorage.setItem(viewKey, mode)
  }

  // Search, filter, sort state from URL params
  const searchQuery = searchParams.get("search") ?? ""
  const conditionFilter = searchParams.get("condition") ?? ""
  const ownedFilter = searchParams.get("ownedStatus") ?? "all"
  const sortBy = searchParams.get("sortBy") ?? "name"
  const sortDir = searchParams.get("sortDir") ?? "asc"

  function updateParam(key: string, value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      const shouldDelete =
        !value ||
        (key === "ownedStatus" && value === "all") ||
        (key === "condition" && (value === "" || value === "all")) ||
        (key === "sortBy" && value === "name") ||
        (key === "sortDir" && value === "asc")
      if (shouldDelete) {
        next.delete(key)
      } else {
        next.set(key, value)
      }
      return next
    })
  }

  // Add item dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formIdentifier, setFormIdentifier] = useState("")
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formReleaseDate, setFormReleaseDate] = useState("")
  const [formManufacturer, setFormManufacturer] = useState("")
  const [formReferenceCode, setFormReferenceCode] = useState("")
  const [formImageFile, setFormImageFile] = useState<File | null>(null)
  const [formRarity, setFormRarity] = useState("")
  const [formCustomFields, setFormCustomFields] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Sets state
  const [sets, setSets] = useState<SetSummary[]>([])
  const [selectedSet, setSelectedSet] = useState<SetDetail | null>(null)
  const [expandedSets, setExpandedSets] = useState<Set<number>>(new Set())
  const [setDetails, setSetDetails] = useState<Record<number, SetDetail>>({})
  const [setsDialogOpen, setSetsDialogOpen] = useState(false)
  const [editingSet, setEditingSet] = useState<SetSummary | null>(null)
  const [setsFormName, setSetsFormName] = useState("")
  const [setsFormError, setSetsFormError] = useState("")
  const [setsSubmitting, setSetsSubmitting] = useState(false)
  const [deleteSetDialogOpen, setDeleteSetDialogOpen] = useState(false)
  const [deletingSetId, setDeletingSetId] = useState<number | null>(null)
  const [setsDeleting, setSetsDeleting] = useState(false)
  const [deleteSetItemDialogOpen, setDeleteSetItemDialogOpen] = useState(false)
  const [deletingSetItemId, setDeletingSetItemId] = useState<number | null>(null)
  const [setItemDeleting, setSetItemDeleting] = useState(false)

  // Add items to set
  const [addItemsDialogOpen, setAddItemsDialogOpen] = useState(false)
  const [itemSearchQuery, setItemSearchQuery] = useState("")
  const [newItemName, setNewItemName] = useState("")
  const [addItemSubmitting, setAddItemSubmitting] = useState(false)

  // Export state
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv")
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState("")

  // Import state
  const [importDialogOpen, setImportDialogOpen] = useState(false)

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
      const params = new URLSearchParams({ pageSize: "100" })
      if (searchQuery) params.set("search", searchQuery)
      if (conditionFilter) params.set("condition", conditionFilter)
      if (ownedFilter && ownedFilter !== "all") params.set("ownedStatus", ownedFilter)
      if (sortBy) params.set("sortBy", sortBy)
      if (sortDir) params.set("sortDir", sortDir)

      const res = await fetch(`/api/collections/${id}/items?${params}`, { headers })
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
  }, [id, token, searchQuery, conditionFilter, ownedFilter, sortBy, sortDir]) // eslint-disable-line react-hooks/exhaustive-deps

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
      setSetDetails((prev) => ({ ...prev, [setId]: data }))
    } catch {
      // non-critical
    }
  }, [id, token]) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleSetExpanded(setId: number) {
    setExpandedSets((prev) => {
      const next = new Set(prev)
      if (next.has(setId)) {
        next.delete(setId)
      } else {
        next.add(setId)
        // Fetch detail if not already loaded
        if (!setDetails[setId]) {
          fetchSetDetail(setId)
        }
      }
      return next
    })
  }

  function openAddItemsForSet(s: SetSummary) {
    // Load set detail for the add items dialog
    fetchSetDetail(s.id)
    setAddItemsDialogOpen(true)
  }

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

  // Refetch items when search/filter/sort params change
  useEffect(() => {
    if (collection) {
      fetchItems()
    }
  }, [searchQuery, conditionFilter, ownedFilter, sortBy, sortDir]) // eslint-disable-line react-hooks/exhaustive-deps

  function openAddItem() {
    setFormIdentifier("")
    setFormName("")
    setFormDescription("")
    setFormReleaseDate("")
    setFormManufacturer("")
    setFormReferenceCode("")
    setFormImageFile(null)
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

      const saved = await res.json()

      if (formImageFile) {
        const formData = new FormData()
        formData.append("image", formImageFile)
        const imgRes = await fetch(`/api/collections/${id}/items/${saved.id}/image`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })
        if (!imgRes.ok) {
          setFormError(t("collectionDetail.imageUploadFailed"))
        }
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
      setExpandedSets((prev) => { const next = new Set(prev); next.delete(deletingSetId); return next })
      setSetDetails((prev) => { const next = { ...prev }; delete next[deletingSetId]; return next })
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

  function confirmRemoveSetItem(setItemId: number) {
    setDeletingSetItemId(setItemId)
    setDeleteSetItemDialogOpen(true)
  }

  async function handleRemoveSetItem() {
    if (!selectedSet || deletingSetItemId == null) return
    setSetItemDeleting(true)
    try {
      const res = await fetch(`/api/collections/${id}/sets/${selectedSet.id}/items/${deletingSetItemId}`, {
        method: "DELETE",
        headers,
      })
      if (!res.ok) throw new Error("Failed to remove item")
      setDeleteSetItemDialogOpen(false)
      setDeletingSetItemId(null)
      await fetchSetDetail(selectedSet.id)
      await fetchSets()
    } catch {
      // non-critical
    } finally {
      setSetItemDeleting(false)
    }
  }

  // --- Export ---
  async function handleExport() {
    setExportError("")
    setExporting(true)
    try {
      const res = await fetch(`/api/collections/${id}/export?format=${exportFormat}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(t("collectionDetail.exportFailed"))
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${collection?.name ?? "collection"}.${exportFormat}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setExportDialogOpen(false)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : t("collectionDetail.exportFailed"))
    } finally {
      setExporting(false)
    }
  }

  // --- Import ---
  function openImportDialog() {
    setImportDialogOpen(true)
  }

  async function handleImportComplete() {
    await fetchItems()
    await fetchCollection()
    toast.success(t("collectionDetail.importCompleteToast"))
  }

  async function handleReorderItems(newItems: CatalogItem[]) {
    const previousItems = items
    setItems(newItems)

    try {
      const res = await fetch(`/api/collections/${id}/items/reorder`, {
        method: "POST",
        headers,
        body: JSON.stringify({ itemIds: newItems.map((i) => i.id) }),
      })
      if (!res.ok) throw new Error("Failed to reorder")
    } catch {
      toast.error(t("collectionDetail.reorderFailed"))
      setItems(previousItems)
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

  // Table view columns
  const tableColumns: DataTableColumn<CatalogItem>[] = [
    {
      header: "",
      accessor: (row) => (
        <div className="h-10 w-10 overflow-hidden rounded bg-muted">
          {row.image ? (
            <img src={row.image} alt={row.name} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Image className="h-4 w-4 text-muted-foreground/40" />
            </div>
          )}
        </div>
      ),
      className: "w-[60px]",
    },
    {
      header: t("collectionDetail.nameLabel"),
      accessor: "name" as keyof CatalogItem,
      sortable: true,
      sortKey: "name",
    },
    {
      header: t("collectionDetail.identifierLabel"),
      accessor: "identifier" as keyof CatalogItem,
    },
    {
      header: t("collectionDetail.conditionAll").replace("All ", ""),
      accessor: (row) => {
        const isOwned = ownedItemIds.has(row.id)
        return isOwned ? (
          <Badge variant="success" size="sm">{t("collectionDetail.ownedOwned")}</Badge>
        ) : (
          <Badge variant="outline" size="sm">{t("collectionDetail.ownedUnowned")}</Badge>
        )
      },
    },
    {
      header: t("collectionDetail.rarityLabel"),
      accessor: (row) => row.rarity ?? "—",
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <SkeletonRect width="32px" height="32px" className="rounded" />
          <div className="space-y-2">
            <SkeletonRect width="200px" height="28px" />
            <SkeletonRect width="120px" height="16px" />
          </div>
        </div>
        <div className="flex gap-2">
          <SkeletonRect width="100%" height="36px" className="flex-1" />
          <SkeletonRect width="140px" height="36px" />
          <SkeletonRect width="140px" height="36px" />
        </div>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border bg-card">
              <SkeletonRect width="100%" height="0" className="aspect-square" style={{ paddingBottom: "100%" }} />
              <div className="p-3 space-y-2">
                <SkeletonRect width="80%" height="16px" />
                <SkeletonRect width="50%" height="12px" />
              </div>
            </div>
          ))}
        </div>
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

      {/* PageHeader with collection name, type badge, and action buttons */}
      <PageHeader
        title={collection.name}
        description={collection.description ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            {collectionType && (
              <Badge variant="primary" size="sm">{collectionType.name}</Badge>
            )}
            <span className="text-sm text-muted-foreground">
              {t("collections.itemCount", { count: totalCount })}
            </span>
          </div>
        }
      />

      {/* Cover image */}
      {collection.coverImage && (
        <div className="mt-4 overflow-hidden rounded-lg">
          <img
            src={collection.coverImage}
            alt={collection.name}
            className="h-48 w-full object-cover sm:h-56"
            loading="lazy"
          />
        </div>
      )}

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
              ? "border-accent text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("items")}
        >
          {t("collectionDetail.catalogItems")}
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "sets"
              ? "border-accent text-foreground"
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
          {/* Toolbar: actions row */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex rounded-md border border-input shadow-sm">
                <button
                  className={`flex h-9 w-9 items-center justify-center transition-colors ${
                    viewMode === "grid"
                      ? "bg-primary text-primary-foreground"
                      : "bg-transparent text-muted-foreground hover:text-foreground"
                  } rounded-l-md`}
                  onClick={() => changeViewMode("grid")}
                  title={t("collectionDetail.viewGrid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  className={`flex h-9 w-9 items-center justify-center transition-colors ${
                    viewMode === "table"
                      ? "bg-primary text-primary-foreground"
                      : "bg-transparent text-muted-foreground hover:text-foreground"
                  } rounded-r-md`}
                  onClick={() => changeViewMode("table")}
                  title={t("collectionDetail.viewTable")}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setExportError(""); setExportDialogOpen(true) }}>
                <Download className="h-4 w-4" />
                {t("collectionDetail.export")}
              </Button>
              <Button variant="outline" size="sm" onClick={openImportDialog}>
                <Upload className="h-4 w-4" />
                {t("collectionDetail.import")}
              </Button>
              <Button onClick={openAddItem} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="h-4 w-4" />
                {t("collectionDetail.addItem")}
              </Button>
            </div>
          </div>

          {/* Search, Filter, Sort controls */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 h-9"
                placeholder={t("collectionDetail.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => updateParam("search", e.target.value)}
              />
            </div>

            {/* Condition filter - DS Select */}
            <Select value={conditionFilter || "all"} onValueChange={(v) => updateParam("condition", v)}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder={t("collectionDetail.conditionAll")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("collectionDetail.conditionAll")}</SelectItem>
                <SelectItem value="Mint">{t("collectionDetail.conditionMint")}</SelectItem>
                <SelectItem value="NearMint">{t("collectionDetail.conditionNearMint")}</SelectItem>
                <SelectItem value="Excellent">{t("collectionDetail.conditionExcellent")}</SelectItem>
                <SelectItem value="Good">{t("collectionDetail.conditionGood")}</SelectItem>
                <SelectItem value="Fair">{t("collectionDetail.conditionFair")}</SelectItem>
                <SelectItem value="Poor">{t("collectionDetail.conditionPoor")}</SelectItem>
              </SelectContent>
            </Select>

            {/* Owned status toggle */}
            <div className="flex rounded-md border border-input shadow-sm">
              {(["all", "owned", "unowned"] as const).map((status) => (
                <button
                  key={status}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    ownedFilter === status
                      ? "bg-primary text-primary-foreground"
                      : "bg-transparent text-muted-foreground hover:text-foreground"
                  } ${status === "all" ? "rounded-l-md" : status === "unowned" ? "rounded-r-md" : ""}`}
                  onClick={() => updateParam("ownedStatus", status)}
                >
                  {t(`collectionDetail.owned${status.charAt(0).toUpperCase() + status.slice(1)}`)}
                </button>
              ))}
            </div>

            {/* Sort - DS Select */}
            <Select value={sortBy} onValueChange={(v) => updateParam("sortBy", v)}>
              <SelectTrigger className="h-9 w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">{t("collectionDetail.sortName")}</SelectItem>
                <SelectItem value="price">{t("collectionDetail.sortPrice")}</SelectItem>
                <SelectItem value="value">{t("collectionDetail.sortValue")}</SelectItem>
                <SelectItem value="date">{t("collectionDetail.sortDate")}</SelectItem>
                <SelectItem value="rarity">{t("collectionDetail.sortRarity")}</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort direction toggle */}
            <button
              className="flex h-9 w-9 items-center justify-center rounded-md border border-input shadow-sm hover:bg-muted/50 transition-colors"
              onClick={() => updateParam("sortDir", sortDir === "asc" ? "desc" : "asc")}
              title={sortDir === "asc" ? t("collectionDetail.sortAsc") : t("collectionDetail.sortDesc")}
            >
              {sortDir === "asc" ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Content: empty state, grid view, or table view */}
          {items.length === 0 ? (
            <EmptyState
              icon={<Package />}
              title={t("emptyStates.collectionDetail.title")}
              description={t("emptyStates.collectionDetail.description")}
              actionLabel={t("emptyStates.collectionDetail.action")}
              onAction={() => setDialogOpen(true)}
            />
          ) : viewMode === "grid" ? (
            <SortableList
              items={items}
              keyExtractor={(item) => item.id}
              layout="grid"
              gridClassName="mt-4 grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
              onReorder={handleReorderItems}
              renderItem={(item, { dragHandleProps, isDragging }) => {
                const isOwned = ownedItemIds.has(item.id)
                return (
                  <Card
                    className={`relative group cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                      isOwned ? "ring-2 ring-success/50" : ""
                    } ${isDragging ? "ring-2 ring-accent shadow-lg" : ""}`}
                    onClick={() => navigate(`/collections/${id}/items/${item.id}`)}
                  >
                    {/* Drag handle */}
                    <button
                      type="button"
                      className="absolute top-2 left-2 z-10 cursor-grab touch-none rounded bg-black/40 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                      {...dragHandleProps}
                    >
                      <GripVertical className="h-3.5 w-3.5" />
                    </button>

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
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
                          <Image className="h-10 w-10 text-muted-foreground/30" />
                        </div>
                      )}
                      {/* Owned badge */}
                      {isOwned && (
                        <div className="absolute top-2 right-2 rounded-full bg-success p-1 text-white shadow-sm">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                      {/* Hover overlay with quick action */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
                        <span className="rounded-md bg-white/90 px-3 py-1.5 text-xs font-medium text-foreground shadow">
                          {t("collections.view")}
                        </span>
                      </div>
                    </div>

                    <CardContent className="p-3">
                      <h3 className="truncate text-sm font-semibold">{item.name}</h3>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {item.identifier}
                      </p>
                      {isOwned && (
                        <Badge variant="success" size="sm" className="mt-1.5">{t("collectionDetail.ownedOwned")}</Badge>
                      )}
                    </CardContent>
                  </Card>
                )
              }}
            />
          ) : (
            <div className="mt-4">
              <DataTable<CatalogItem>
                columns={tableColumns}
                data={items}
                sortKey={sortBy}
                sortDirection={sortDir as "asc" | "desc"}
                onSort={(key, dir) => {
                  updateParam("sortBy", key)
                  updateParam("sortDir", dir)
                }}
                onRowClick={(row) => navigate(`/collections/${id}/items/${row.id}`)}
                emptyState={
                  <EmptyState
                    icon={<Package />}
                    title={t("emptyStates.collectionDetail.title")}
                    description={t("emptyStates.collectionDetail.description")}
                    actionLabel={t("emptyStates.collectionDetail.action")}
                    onAction={() => setDialogOpen(true)}
                  />
                }
              />
            </div>
          )}
        </>
      )}

      {/* Sets Tab */}
      {activeTab === "sets" && (
        <div className="mt-4">
          {/* Sets toolbar */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold font-display">{t("sets.title")}</h2>
            <Button onClick={openCreateSet}>
              <Plus className="h-4 w-4" />
              {t("sets.create")}
            </Button>
          </div>

          {sets.length === 0 ? (
            <EmptyState
              icon={<Package />}
              title={t("sets.empty")}
              description={t("sets.emptyDescription")}
              actionLabel={t("sets.create")}
              onAction={openCreateSet}
            />
          ) : (
            <div className="mt-4 space-y-3">
              {sets.map((s) => {
                const pct = s.completionPercentage ?? 0
                const isExpanded = expandedSets.has(s.id)
                const detail = setDetails[s.id]
                return (
                  <Card key={s.id} className="overflow-hidden">
                    {/* Accordion header */}
                    <button
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
                      onClick={() => toggleSetExpanded(s.id)}
                    >
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                          isExpanded ? "rotate-0" : "-rotate-90"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-semibold">{s.name}</h3>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {s.completedCount ?? 0}/{s.expectedItemCount} {t("sets.items")}
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-primary/10">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                pct >= 100 ? "bg-green-500" : "bg-accent"
                              }`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      {/* Action buttons */}
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          onClick={(e) => { e.stopPropagation(); openAddItemsForSet(s) }}
                          title={t("sets.addItems")}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          onClick={(e) => { e.stopPropagation(); openEditSet(s) }}
                          title={t("sets.edit")}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); confirmDeleteSet(s.id) }}
                          title={t("sets.delete")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </button>

                    {/* Accordion content */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          key={`set-content-${s.id}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <CardContent className="border-t pt-3 pb-4">
                            {!detail ? (
                              /* Loading skeleton */
                              <div className="space-y-2">
                                {Array.from({ length: 3 }).map((_, i) => (
                                  <div key={i} className="flex items-center gap-2 px-2 py-1.5">
                                    <SkeletonRect width={16} height={16} className="rounded-full" />
                                    <SkeletonRect width={`${60 + i * 10}%`} height={14} />
                                  </div>
                                ))}
                              </div>
                            ) : detail.items && detail.items.length > 0 ? (
                              <ul className="space-y-0.5">
                                {detail.items
                                  .sort((a, b) => a.sortOrder - b.sortOrder)
                                  .map((si) => {
                                    const owned = isSetItemOwned(si)
                                    return (
                                      <li
                                        key={si.id}
                                        className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50"
                                      >
                                        {owned ? (
                                          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                                        ) : (
                                          <Circle className="h-4 w-4 shrink-0 text-muted-foreground/30" />
                                        )}
                                        <span className={`truncate ${owned ? "text-foreground" : "text-muted-foreground"}`}>
                                          {si.name}
                                        </span>
                                        <div className="ml-auto flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                          {si.catalogItemId && (
                                            <button
                                              className="text-xs text-primary hover:underline"
                                              onClick={() => navigate(`/collections/${id}/items/${si.catalogItemId}`)}
                                            >
                                              {t("sets.viewItem")}
                                            </button>
                                          )}
                                          <button
                                            className="rounded p-1 text-muted-foreground hover:text-destructive"
                                            onClick={() => {
                                              // Set selectedSet for the remove handler
                                              setSelectedSet(detail)
                                              confirmRemoveSetItem(si.id)
                                            }}
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      </li>
                                    )
                                  })}
                              </ul>
                            ) : (
                              <p className="py-4 text-center text-sm text-muted-foreground">
                                {t("sets.emptyItems")}
                              </p>
                            )}
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                )
              })}
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
                type="file"
                accept="image/*"
                onChange={(e) => setFormImageFile(e.target.files?.[0] ?? null)}
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
      <ConfirmDialog
        open={deleteSetDialogOpen}
        onOpenChange={setDeleteSetDialogOpen}
        title={t("sets.deleteTitle")}
        description={t("sets.deleteConfirm")}
        confirmLabel={t("sets.delete")}
        cancelLabel={t("sets.cancel")}
        loadingLabel={t("sets.deleting")}
        loading={setsDeleting}
        onConfirm={handleDeleteSet}
      />

      {/* Delete Set Item Confirmation Dialog */}
      <ConfirmDialog
        open={deleteSetItemDialogOpen}
        onOpenChange={(open) => { setDeleteSetItemDialogOpen(open); if (!open) setDeletingSetItemId(null) }}
        title={t("sets.removeItemTitle")}
        description={t("sets.removeItemConfirm")}
        confirmLabel={t("sets.delete")}
        cancelLabel={t("sets.cancel")}
        loadingLabel={t("sets.deleting")}
        loading={setItemDeleting}
        onConfirm={handleRemoveSetItem}
      />

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("collectionDetail.exportTitle")}</DialogTitle>
            <DialogDescription>{t("collectionDetail.exportDescription")}</DialogDescription>
          </DialogHeader>
          {exportError && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
              {exportError}
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("collectionDetail.exportFormat")}</Label>
              <div className="flex gap-2">
                <button
                  className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                    exportFormat === "csv"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input bg-transparent text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setExportFormat("csv")}
                >
                  {t("collectionDetail.exportCSV")}
                </button>
                <button
                  className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                    exportFormat === "json"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input bg-transparent text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setExportFormat("json")}
                >
                  {t("collectionDetail.exportJSON")}
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setExportDialogOpen(false)} disabled={exporting}>
                {t("collectionDetail.cancel")}
              </Button>
              <Button onClick={handleExport} disabled={exporting}>
                <Download className="h-4 w-4" />
                {exporting ? t("collectionDetail.saving") : t("collectionDetail.exportDownload")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Wizard */}
      <ImportWizard
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        collectionId={id!}
        token={token!}
        onImportComplete={handleImportComplete}
      />

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
