import { useState, useEffect, useCallback, type FormEvent } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Plus, ArrowLeft, Image, Package, Check } from "lucide-react"
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

  useEffect(() => {
    async function load() {
      setLoading(true)
      const col = await fetchCollection()
      if (col) {
        await Promise.all([fetchCollectionType(col.collectionTypeId), fetchItems()])
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
      // Refresh collection to update item count
      await fetchCollection()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t("collectionDetail.saveFailed"))
    } finally {
      setSubmitting(false)
    }
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

      {/* Toolbar */}
      <div className="mt-6 flex items-center justify-between">
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
    </div>
  )
}
