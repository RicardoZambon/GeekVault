import { useState, useEffect, useCallback, type FormEvent } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  Image,
  Pencil,
  Trash2,
  Box,
  Plus,
  ChevronRight,
  Calendar,
  Check,
  X,
  Loader2,
  DollarSign,
  Tag,
  FileText,
  ShoppingBag,
} from "lucide-react"
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
import {
  Card,
  CardContent,
  Badge,
  EmptyState,
  PageHeader,
  SkeletonRect,
  SkeletonText,
  StaggerChildren,
  staggerItemVariants,
  FadeIn,
  toast,
} from "@/components/ds"
import { motion } from "framer-motion"

const CONDITIONS = ["Mint", "NearMint", "Excellent", "Good", "Fair", "Poor"] as const

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

interface CustomFieldValue {
  name: string
  value: string
}

interface OwnedCopy {
  id: number
  catalogItemId: number
  condition: string
  purchasePrice: number | null
  estimatedValue: number | null
  acquisitionDate: string | null
  acquisitionSource: string | null
  notes: string | null
  images: string[]
}

interface CatalogItemFull {
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
  ownedCopies: OwnedCopy[] | null
}

interface Collection {
  id: number
  name: string
  collectionTypeId: number
}

interface SetItem {
  id: number
  setId: number
  catalogItemId: number | null
  name: string
  sortOrder: number
}

interface SetSummary {
  id: number
  collectionId: number
  name: string
  expectedItemCount: number
  completedCount: number | null
  completionPercentage: number | null
}

interface SetDetail extends SetSummary {
  items: SetItem[]
}

export default function CatalogItemDetail() {
  const { id: collectionId, itemId } = useParams()
  const { t } = useTranslation()
  const { token } = useAuth()
  const navigate = useNavigate()

  const [item, setItem] = useState<CatalogItemFull | null>(null)
  const [collection, setCollection] = useState<Collection | null>(null)
  const [copies, setCopies] = useState<OwnedCopy[]>([])
  const [collectionType, setCollectionType] = useState<CollectionTypeDetail | null>(null)
  const [itemSets, setItemSets] = useState<SetDetail[]>([])
  const [loading, setLoading] = useState(true)

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
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

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Owned copy dialog
  const [copyDialogOpen, setCopyDialogOpen] = useState(false)
  const [editingCopy, setEditingCopy] = useState<OwnedCopy | null>(null)
  const [copyCondition, setCopyCondition] = useState("Mint")
  const [copyPurchasePrice, setCopyPurchasePrice] = useState("")
  const [copyEstimatedValue, setCopyEstimatedValue] = useState("")
  const [copyAcquisitionDate, setCopyAcquisitionDate] = useState("")
  const [copyAcquisitionSource, setCopyAcquisitionSource] = useState("")
  const [copyNotes, setCopyNotes] = useState("")
  const [copyImageFiles, setCopyImageFiles] = useState<File[]>([])
  const [copyError, setCopyError] = useState("")
  const [copySubmitting, setCopySubmitting] = useState(false)

  // Delete copy dialog
  const [deleteCopyOpen, setDeleteCopyOpen] = useState(false)
  const [deletingCopy, setDeletingCopy] = useState(false)
  const [copyToDelete, setCopyToDelete] = useState<OwnedCopy | null>(null)

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }

  const fetchItem = useCallback(async () => {
    try {
      const res = await fetch(`/api/collections/${collectionId}/items/${itemId}`, { headers })
      if (!res.ok) throw new Error("Not found")
      const data: CatalogItemFull = await res.json()
      setItem(data)
      return data
    } catch {
      toast.error(t("itemDetail.fetchError"))
      return null
    }
  }, [collectionId, itemId, token]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCopies = useCallback(async () => {
    try {
      const res = await fetch(`/api/items/${itemId}/copies`, { headers })
      if (!res.ok) return
      const data: OwnedCopy[] = await res.json()
      setCopies(data)
    } catch {
      // non-critical
    }
  }, [itemId, token]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCollectionType = useCallback(async (typeId: number) => {
    try {
      const res = await fetch(`/api/collection-types/${typeId}`, { headers })
      if (!res.ok) return
      const data: CollectionTypeDetail = await res.json()
      setCollectionType(data)
    } catch {
      // non-critical
    }
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchItemSets = useCallback(async (catalogItemId: number) => {
    try {
      const res = await fetch(`/api/collections/${collectionId}/sets`, { headers })
      if (!res.ok) return
      const sets: SetSummary[] = await res.json()
      if (sets.length === 0) return

      // Fetch details for each set in parallel to check item membership
      const details = await Promise.all(
        sets.map(async (s) => {
          const r = await fetch(`/api/collections/${collectionId}/sets/${s.id}`, { headers })
          if (!r.ok) return null
          return r.json() as Promise<SetDetail>
        })
      )

      const matching = details.filter(
        (d): d is SetDetail => d !== null && d.items?.some((si) => si.catalogItemId === catalogItemId)
      )
      setItemSets(matching)
    } catch {
      // non-critical
    }
  }, [collectionId, token]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    async function load() {
      setLoading(true)
      const fetchedItem = await fetchItem()
      if (fetchedItem) {
        try {
          const colRes = await fetch(`/api/collections/${collectionId}`, { headers })
          if (colRes.ok) {
            const col: Collection = await colRes.json()
            setCollection(col)
            await fetchCollectionType(col.collectionTypeId)
          }
        } catch {
          // non-critical
        }
        await Promise.all([fetchCopies(), fetchItemSets(fetchedItem.id)])
      }
      setLoading(false)
    }
    load()
  }, [collectionId, itemId]) // eslint-disable-line react-hooks/exhaustive-deps

  function openEdit() {
    if (!item) return
    setFormIdentifier(item.identifier)
    setFormName(item.name)
    setFormDescription(item.description ?? "")
    setFormReleaseDate(item.releaseDate ?? "")
    setFormManufacturer(item.manufacturer ?? "")
    setFormReferenceCode(item.referenceCode ?? "")
    setFormImageFile(null)
    setFormRarity(item.rarity ?? "")
    const cf: Record<string, string> = {}
    for (const fv of item.customFieldValues ?? []) {
      cf[fv.name] = fv.value
    }
    setFormCustomFields(cf)
    setFormError("")
    setEditOpen(true)
  }

  async function handleEditSubmit(e: FormEvent) {
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

      const res = await fetch(`/api/collections/${collectionId}/items/${itemId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message ?? t("collectionDetail.saveFailed"))
      }

      if (formImageFile) {
        const formData = new FormData()
        formData.append("image", formImageFile)
        const imgRes = await fetch(`/api/collections/${collectionId}/items/${itemId}/image`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })
        if (!imgRes.ok) {
          toast.error(t("collectionDetail.imageUploadFailed"))
        }
      }

      setEditOpen(false)
      toast.success(t("itemDetail.updateSuccess"))
      await fetchItem()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t("collectionDetail.saveFailed"))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/collections/${collectionId}/items/${itemId}`, {
        method: "DELETE",
        headers,
      })
      if (!res.ok) throw new Error("Failed")
      toast.success(t("itemDetail.deleteSuccess"))
      navigate(`/collections/${collectionId}`)
    } catch {
      toast.error(t("itemDetail.deleteFailed"))
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  function openAddCopy() {
    setEditingCopy(null)
    setCopyCondition("Mint")
    setCopyPurchasePrice("")
    setCopyEstimatedValue("")
    setCopyAcquisitionDate("")
    setCopyAcquisitionSource("")
    setCopyNotes("")
    setCopyImageFiles([])
    setCopyError("")
    setCopyDialogOpen(true)
  }

  function openEditCopy(copy: OwnedCopy) {
    setEditingCopy(copy)
    setCopyCondition(copy.condition)
    setCopyPurchasePrice(copy.purchasePrice != null ? String(copy.purchasePrice) : "")
    setCopyEstimatedValue(copy.estimatedValue != null ? String(copy.estimatedValue) : "")
    setCopyAcquisitionDate(copy.acquisitionDate ?? "")
    setCopyAcquisitionSource(copy.acquisitionSource ?? "")
    setCopyNotes(copy.notes ?? "")
    setCopyImageFiles([])
    setCopyError("")
    setCopyDialogOpen(true)
  }

  async function handleCopySubmit(e: FormEvent) {
    e.preventDefault()
    setCopyError("")
    setCopySubmitting(true)

    try {
      const body = {
        condition: copyCondition,
        purchasePrice: copyPurchasePrice ? parseFloat(copyPurchasePrice) : null,
        estimatedValue: copyEstimatedValue ? parseFloat(copyEstimatedValue) : null,
        acquisitionDate: copyAcquisitionDate || null,
        acquisitionSource: copyAcquisitionSource.trim() || null,
        notes: copyNotes.trim() || null,
      }

      const url = editingCopy
        ? `/api/items/${itemId}/copies/${editingCopy.id}`
        : `/api/items/${itemId}/copies`
      const method = editingCopy ? "PUT" : "POST"

      const res = await fetch(url, { method, headers, body: JSON.stringify(body) })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message ?? t("ownedCopy.saveFailed"))
      }

      const saved = await res.json()
      const copyId = editingCopy?.id ?? saved.id

      // Upload images in parallel
      if (copyImageFiles.length > 0) {
        const uploadResults = await Promise.all(
          copyImageFiles.map((file) => {
            const formData = new FormData()
            formData.append("image", file)
            return fetch(`/api/items/${itemId}/copies/${copyId}/images`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: formData,
            })
          })
        )
        if (uploadResults.some((r) => !r.ok)) {
          toast.error(t("ownedCopy.imageUploadFailed"))
        }
      }

      setCopyDialogOpen(false)
      toast.success(editingCopy ? t("ownedCopy.updateSuccess") : t("ownedCopy.addSuccess"))
      await fetchCopies()
    } catch (err) {
      setCopyError(err instanceof Error ? err.message : t("ownedCopy.saveFailed"))
    } finally {
      setCopySubmitting(false)
    }
  }

  async function handleDeleteCopy() {
    if (!copyToDelete) return
    setDeletingCopy(true)
    try {
      const res = await fetch(`/api/items/${itemId}/copies/${copyToDelete.id}`, {
        method: "DELETE",
        headers,
      })
      if (!res.ok) throw new Error("Failed")
      setDeleteCopyOpen(false)
      setCopyToDelete(null)
      toast.success(t("ownedCopy.deleteSuccess"))
      await fetchCopies()
    } catch {
      toast.error(t("ownedCopy.deleteFailed"))
      setDeletingCopy(false)
      setDeleteCopyOpen(false)
    }
  }

  function formatCondition(condition: string): string {
    return condition.replace(/([a-z])([A-Z])/g, "$1 $2")
  }

  function formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    /* v8 ignore next 3 */
    } catch {
      return dateStr
    }
  }

  function getCompletionColor(pct: number | null): string {
    if (pct == null) return "text-muted-foreground"
    if (pct >= 100) return "text-green-500"
    if (pct >= 50) return "text-accent"
    return "text-muted-foreground"
  }

  /* v8 ignore start -- custom field type rendering branches */
  function renderCustomFieldValue(field: CustomFieldDefinition | undefined, value: string) {
    if (!field) return <span className="text-sm text-foreground">{value}</span>

    switch (field.type) {
      case "boolean":
        return value === "true" ? (
          <Check className="h-4 w-4 text-success" />
        ) : (
          <X className="h-4 w-4 text-muted-foreground" />
        )
      case "date":
        return <span className="text-sm text-foreground">{formatDate(value)}</span>
      case "enum":
        return <Badge variant="outline" size="sm">{value}</Badge>
      default:
        return <span className="text-sm text-foreground">{value}</span>
    }
  }
  /* v8 ignore stop */

  // Skeleton loading state
  if (loading) {
    return (
      <FadeIn>
        <div className="space-y-6">
          {/* Breadcrumb skeleton */}
          <SkeletonRect width="240px" height="16px" />

          {/* Hero skeleton */}
          <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <SkeletonRect className="aspect-square w-full rounded-lg" />
            </div>
            <div className="lg:col-span-3 space-y-4">
              <SkeletonRect width="60%" height="32px" />
              <SkeletonRect width="40%" height="20px" />
              <div className="flex gap-2 mt-4">
                <SkeletonRect width="80px" height="36px" className="rounded-md" />
                <SkeletonRect width="80px" height="36px" className="rounded-md" />
                <SkeletonRect width="100px" height="36px" className="rounded-md" />
              </div>
              <div className="mt-6">
                <SkeletonText lines={3} />
              </div>
            </div>
          </div>

          {/* Fields skeleton */}
          <Card variant="flat">
            <CardContent className="p-6">
              <SkeletonRect width="120px" height="20px" className="mb-4" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <SkeletonRect width="80px" height="12px" />
                    <SkeletonRect width="120px" height="16px" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Copies skeleton */}
          <div>
            <SkeletonRect width="160px" height="24px" className="mb-4" />
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <SkeletonRect key={i} className="h-40 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </FadeIn>
    )
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("itemDetail.notFound")}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(`/collections/${collectionId}`)}>
          {t("itemDetail.backToCollection")}
        </Button>
      </div>
    )
  }

  const fieldDefinitionMap = new Map(
    (collectionType?.customFields ?? []).map((f) => [f.name, f])
  )

  return (
    <FadeIn>
      <div className="space-y-6">
        {/* Breadcrumb navigation */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link
            to="/collections"
            className="hover:text-foreground transition-colors"
          >
            {t("nav.collections")}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link
            to={`/collections/${collectionId}`}
            className="hover:text-foreground transition-colors"
          >
            {collection?.name ?? t("itemDetail.backToCollection")}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium truncate max-w-[200px]">
            {item.name}
          </span>
        </nav>

        {/* Hero section */}
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left: Image */}
          <div className="lg:col-span-2">
            <Card variant="flat" className="overflow-hidden">
              <div className="aspect-square bg-muted">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-[400ms] ease-out hover:scale-[1.03]"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Image className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right: Item name, identifier, actions */}
          <div className="lg:col-span-3 space-y-4">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                {item.name}
              </h1>
              <p className="mt-1 text-base text-muted-foreground">{item.identifier}</p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={openEdit}>
                <Pencil className="h-4 w-4 mr-1.5" />
                {t("itemDetail.edit")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteOpen(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                {t("itemDetail.delete")}
              </Button>
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={openAddCopy}>
                <Plus className="h-4 w-4 mr-1.5" />
                {t("ownedCopy.add")}
              </Button>
            </div>

            {/* Description */}
            {item.description && (
              <div className="pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t("collectionDetail.descriptionLabel")}
                </h3>
                <p className="text-sm leading-relaxed text-foreground">{item.description}</p>
              </div>
            )}

            {/* Core info fields */}
            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {item.manufacturer && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("collectionDetail.manufacturerLabel")}
                  </span>
                  <p className="text-sm text-foreground mt-0.5">{item.manufacturer}</p>
                </div>
              )}
              {item.releaseDate && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("collectionDetail.releaseDateLabel")}
                  </span>
                  <p className="text-sm text-foreground mt-0.5 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatDate(item.releaseDate)}
                  </p>
                </div>
              )}
              {item.referenceCode && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("collectionDetail.referenceCodeLabel")}
                  </span>
                  <p className="text-sm text-foreground mt-0.5">{item.referenceCode}</p>
                </div>
              )}
              {item.rarity && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("collectionDetail.rarityLabel")}
                  </span>
                  <p className="mt-0.5">
                    <Badge variant="accent" size="sm">{item.rarity}</Badge>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Custom field values */}
        {item.customFieldValues && item.customFieldValues.length > 0 && (
          <Card variant="flat">
            <CardContent className="p-6">
              <h3 className="font-display text-base font-semibold mb-4">{t("collectionDetail.customFields")}</h3>
              <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                {item.customFieldValues.map((fv) => (
                  <div key={fv.name}>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {fv.name}
                    </span>
                    <div className="mt-1">
                      {renderCustomFieldValue(fieldDefinitionMap.get(fv.name), fv.value)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Set membership indicator */}
        {itemSets.length > 0 && (
          <div className="space-y-2">
            {itemSets.map((set) => (
              <div
                key={set.id}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-3 hover:bg-muted hover:border-accent/30 transition-colors cursor-pointer"
                tabIndex={0}
                role="link"
                onClick={() => navigate(`/collections/${collectionId}?tab=sets&setId=${set.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    navigate(`/collections/${collectionId}?tab=sets&setId=${set.id}`)
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <Box className="h-5 w-5 text-accent" />
                  <span className="text-sm">
                    {t("itemDetail.partOf")}{" "}
                    <span className="font-medium">{set.name}</span>
                  </span>
                  <span className={`text-sm ${getCompletionColor(set.completionPercentage)}`}>
                    ({set.completedCount ?? 0}/{set.expectedItemCount} {t("itemDetail.setItems")})
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        )}

        {/* Owned copies */}
        <div>
          <PageHeader
            title={t("itemDetail.ownedCopies")}
            actions={
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={openAddCopy}>
                <Plus className="h-4 w-4 mr-1.5" />
                {t("ownedCopy.add")}
              </Button>
            }
            className="mb-4"
          />
          {copies.length === 0 ? (
            <EmptyState
              icon={<Box />}
              title={t("emptyStates.ownedCopies.title")}
              description={t("emptyStates.ownedCopies.description")}
              actionLabel={t("emptyStates.ownedCopies.action")}
              onAction={openAddCopy}
            />
          ) : (
            <StaggerChildren className="grid gap-4 sm:grid-cols-2">
              {copies.map((copy) => (
                <motion.div key={copy.id} variants={staggerItemVariants}>
                  <Card variant="flat" className="group h-full hover:border-accent/20 transition-colors duration-150">
                    <CardContent className="p-5">
                      {/* Header: condition badge + actions */}
                      <div className="flex items-start justify-between mb-4">
                        <Badge
                          variant={
                            copy.condition === "Mint" || copy.condition === "NearMint"
                              ? "success"
                              : copy.condition === "Excellent" || copy.condition === "Good"
                                ? "primary"
                                : "warning"
                          }
                          size="md"
                        >
                          {formatCondition(copy.condition)}
                        </Badge>
                        <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150">
                          <Button variant="ghost" size="sm" onClick={() => openEditCopy(copy)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setCopyToDelete(copy); setDeleteCopyOpen(true) }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Copy details grid */}
                      <div className="grid gap-3 sm:grid-cols-2">
                        {copy.purchasePrice != null && (
                          <div className="flex items-start gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                              <span className="text-xs font-medium text-muted-foreground">{t("itemDetail.purchasePrice")}</span>
                              <p className="text-sm font-semibold tabular-nums">${copy.purchasePrice.toFixed(2)}</p>
                            </div>
                          </div>
                        )}
                        {copy.estimatedValue != null && (
                          <div className="flex items-start gap-2">
                            <Tag className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                              <span className="text-xs font-medium text-muted-foreground">{t("itemDetail.estimatedValue")}</span>
                              <p className="text-sm font-semibold tabular-nums">${copy.estimatedValue.toFixed(2)}</p>
                            </div>
                          </div>
                        )}
                        {copy.acquisitionDate && (
                          <div className="flex items-start gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                              <span className="text-xs font-medium text-muted-foreground">{t("itemDetail.acquisitionDate")}</span>
                              <p className="text-sm">{formatDate(copy.acquisitionDate)}</p>
                            </div>
                          </div>
                        )}
                        {copy.acquisitionSource && (
                          <div className="flex items-start gap-2">
                            <ShoppingBag className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                              <span className="text-xs font-medium text-muted-foreground">{t("itemDetail.acquisitionSource")}</span>
                              <p className="text-sm">{copy.acquisitionSource}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {copy.notes && (
                        <div className="mt-3 pt-3 border-t border-border flex items-start gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">{t("itemDetail.notes")}</span>
                            <p className="text-sm mt-0.5">{copy.notes}</p>
                          </div>
                        </div>
                      )}

                      {/* Thumbnail gallery */}
                      {copy.images.length > 0 && (() => {
                        const maxThumbs = 4
                        const visibleImages = copy.images.slice(0, maxThumbs)
                        const overflowCount = copy.images.length - maxThumbs
                        return (
                          <div className="mt-3 pt-3 border-t border-border">
                            <div className="flex gap-2 flex-wrap">
                              {visibleImages.map((img, idx) => (
                                <div key={idx} className="relative">
                                  <img
                                    src={img}
                                    alt={`${t("ownedCopy.imageAlt")} ${idx + 1}`}
                                    className="h-16 w-16 rounded-md border border-border object-cover hover:ring-2 hover:ring-accent transition-shadow duration-150 cursor-pointer"
                                    loading="lazy"
                                    tabIndex={0}
                                    role="button"
                                    aria-label={`${t("ownedCopy.viewImage")} ${idx + 1}`}
                                  />
                                  {idx === maxThumbs - 1 && overflowCount > 0 && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md text-white text-sm font-semibold cursor-pointer">
                                      +{overflowCount}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })()}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </StaggerChildren>
          )}
        </div>
      </div>

      {/* Edit Item Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("itemDetail.editTitle")}</DialogTitle>
            <DialogDescription>{t("itemDetail.editDescription")}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
                {formError}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-identifier">{t("collectionDetail.identifierLabel")}</Label>
                <Input
                  id="edit-identifier"
                  value={formIdentifier}
                  onChange={(e) => setFormIdentifier(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t("collectionDetail.nameLabel")}</Label>
                <Input
                  id="edit-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">{t("collectionDetail.descriptionLabel")}</Label>
              <Input
                id="edit-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-manufacturer">{t("collectionDetail.manufacturerLabel")}</Label>
                <Input
                  id="edit-manufacturer"
                  value={formManufacturer}
                  onChange={(e) => setFormManufacturer(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-release-date">{t("collectionDetail.releaseDateLabel")}</Label>
                <Input
                  id="edit-release-date"
                  type="date"
                  value={formReleaseDate}
                  onChange={(e) => setFormReleaseDate(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-reference-code">{t("collectionDetail.referenceCodeLabel")}</Label>
                <Input
                  id="edit-reference-code"
                  value={formReferenceCode}
                  onChange={(e) => setFormReferenceCode(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-rarity">{t("collectionDetail.rarityLabel")}</Label>
                <Input
                  id="edit-rarity"
                  value={formRarity}
                  onChange={(e) => setFormRarity(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-image">{t("collectionDetail.imageLabel")}</Label>
              <Input
                id="edit-image"
                type="file"
                accept="image/*"
                onChange={(e) => setFormImageFile(e.target.files?.[0] ?? null)}
                disabled={submitting}
              />
              {item?.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className="mt-2 h-20 w-20 rounded border object-cover"
                />
              )}
            </div>

            {/* Custom fields */}
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
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={submitting}>
                {t("collectionDetail.cancel")}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                {submitting ? t("collectionDetail.saving") : t("collectionDetail.save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("itemDetail.deleteTitle")}
        description={t("itemDetail.deleteConfirm")}
        confirmLabel={t("itemDetail.delete")}
        cancelLabel={t("collectionDetail.cancel")}
        loadingLabel={t("itemDetail.deleting")}
        loading={deleting}
        onConfirm={handleDelete}
      />

      {/* Owned Copy Dialog */}
      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCopy ? t("ownedCopy.editTitle") : t("ownedCopy.addTitle")}
            </DialogTitle>
            <DialogDescription>
              {editingCopy ? t("ownedCopy.editDescription") : t("ownedCopy.addDescription")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCopySubmit} className="space-y-4">
            {copyError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
                {copyError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="copy-condition">{t("ownedCopy.condition")}</Label>
              <select
                id="copy-condition"
                value={copyCondition}
                onChange={(e) => setCopyCondition(e.target.value)}
                disabled={copySubmitting}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>{formatCondition(c)}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="copy-purchase-price">{t("itemDetail.purchasePrice")}</Label>
                <Input
                  id="copy-purchase-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={copyPurchasePrice}
                  onChange={(e) => setCopyPurchasePrice(e.target.value)}
                  disabled={copySubmitting}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="copy-estimated-value">{t("itemDetail.estimatedValue")}</Label>
                <Input
                  id="copy-estimated-value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={copyEstimatedValue}
                  onChange={(e) => setCopyEstimatedValue(e.target.value)}
                  disabled={copySubmitting}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="copy-acquisition-date">{t("itemDetail.acquisitionDate")}</Label>
                <Input
                  id="copy-acquisition-date"
                  type="date"
                  value={copyAcquisitionDate}
                  onChange={(e) => setCopyAcquisitionDate(e.target.value)}
                  disabled={copySubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="copy-acquisition-source">{t("itemDetail.acquisitionSource")}</Label>
                <Input
                  id="copy-acquisition-source"
                  value={copyAcquisitionSource}
                  onChange={(e) => setCopyAcquisitionSource(e.target.value)}
                  disabled={copySubmitting}
                  placeholder={t("ownedCopy.sourcePlaceholder")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="copy-notes">{t("itemDetail.notes")}</Label>
              <Input
                id="copy-notes"
                value={copyNotes}
                onChange={(e) => setCopyNotes(e.target.value)}
                disabled={copySubmitting}
                placeholder={t("ownedCopy.notesPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="copy-images">{t("ownedCopy.imagesLabel")}</Label>
              <Input
                id="copy-images"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) =>
                  setCopyImageFiles(e.target.files ? Array.from(e.target.files) : [])
                }
                disabled={copySubmitting}
              />
              {editingCopy && editingCopy.images.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {editingCopy.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${t("ownedCopy.imageAlt")} ${idx + 1}`}
                      className="h-16 w-16 rounded border object-cover"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCopyDialogOpen(false)} disabled={copySubmitting}>
                {t("collectionDetail.cancel")}
              </Button>
              <Button type="submit" disabled={copySubmitting}>
                {copySubmitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                {copySubmitting ? t("collectionDetail.saving") : t("collectionDetail.save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Copy Confirmation Dialog */}
      <ConfirmDialog
        open={deleteCopyOpen}
        onOpenChange={setDeleteCopyOpen}
        title={t("ownedCopy.deleteTitle")}
        description={
          copyToDelete && copyToDelete.images.length > 0
            ? t("ownedCopy.deleteConfirmWithImages", { count: copyToDelete.images.length })
            : t("ownedCopy.deleteConfirm")
        }
        confirmLabel={t("itemDetail.delete")}
        cancelLabel={t("collectionDetail.cancel")}
        loadingLabel={t("ownedCopy.deleting")}
        loading={deletingCopy}
        onConfirm={handleDeleteCopy}
      />
    </FadeIn>
  )
}
