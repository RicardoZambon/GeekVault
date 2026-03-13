import { useState, useEffect, useCallback, type FormEvent } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowLeft, Image, Pencil, Trash2, Package } from "lucide-react"
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

export default function CatalogItemDetail() {
  const { id: collectionId, itemId } = useParams()
  const { t } = useTranslation()
  const { token } = useAuth()
  const navigate = useNavigate()

  const [item, setItem] = useState<CatalogItemFull | null>(null)
  const [copies, setCopies] = useState<OwnedCopy[]>([])
  const [collectionType, setCollectionType] = useState<CollectionTypeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
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

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
      setError(t("itemDetail.fetchError"))
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

  useEffect(() => {
    async function load() {
      setLoading(true)
      const fetchedItem = await fetchItem()
      if (fetchedItem) {
        // Fetch collection to get collectionTypeId
        try {
          const colRes = await fetch(`/api/collections/${collectionId}`, { headers })
          if (colRes.ok) {
            const col: Collection = await colRes.json()
            await fetchCollectionType(col.collectionTypeId)
          }
        } catch {
          // non-critical
        }
        await fetchCopies()
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
    setFormImage(item.image ?? "")
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
        image: formImage.trim() || null,
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

      setEditOpen(false)
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
      navigate(`/collections/${collectionId}`)
    } catch {
      setError(t("itemDetail.deleteFailed"))
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  function formatCondition(condition: string): string {
    // Convert NearMint -> Near Mint, etc.
    return condition.replace(/([a-z])([A-Z])/g, "$1 $2")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("itemDetail.notFound")}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(`/collections/${collectionId}`)}>
          <ArrowLeft className="h-4 w-4" />
          {t("itemDetail.backToCollection")}
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
        onClick={() => navigate(`/collections/${collectionId}`)}
      >
        <ArrowLeft className="h-4 w-4" />
        {t("itemDetail.backToCollection")}
      </Button>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Image */}
        <div className="lg:col-span-1">
          <div className="overflow-hidden rounded-lg border bg-card">
            <div className="aspect-square bg-muted">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Image className="h-16 w-16 text-muted-foreground/40" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header + actions */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{item.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{item.identifier}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={openEdit}>
                <Pencil className="h-4 w-4" />
                {t("itemDetail.edit")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
                {t("itemDetail.delete")}
              </Button>
            </div>
          </div>

          {/* Core fields */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            {item.description && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">{t("collectionDetail.descriptionLabel")}</span>
                <p className="text-sm">{item.description}</p>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {item.manufacturer && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">{t("collectionDetail.manufacturerLabel")}</span>
                  <p className="text-sm">{item.manufacturer}</p>
                </div>
              )}
              {item.releaseDate && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">{t("collectionDetail.releaseDateLabel")}</span>
                  <p className="text-sm">{item.releaseDate}</p>
                </div>
              )}
              {item.referenceCode && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">{t("collectionDetail.referenceCodeLabel")}</span>
                  <p className="text-sm">{item.referenceCode}</p>
                </div>
              )}
              {item.rarity && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">{t("collectionDetail.rarityLabel")}</span>
                  <p className="text-sm">{item.rarity}</p>
                </div>
              )}
            </div>
          </div>

          {/* Custom field values */}
          {item.customFieldValues && item.customFieldValues.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="text-sm font-semibold mb-3">{t("collectionDetail.customFields")}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {item.customFieldValues.map((fv) => (
                  <div key={fv.name}>
                    <span className="text-xs font-medium text-muted-foreground">{fv.name}</span>
                    <p className="text-sm">{fv.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Owned copies */}
          <div>
            <h3 className="text-lg font-semibold mb-3">{t("itemDetail.ownedCopies")}</h3>
            {copies.length === 0 ? (
              <div className="rounded-lg border bg-card p-6 text-center">
                <Package className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">{t("itemDetail.noCopies")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {copies.map((copy) => (
                  <div key={copy.id} className="rounded-lg border bg-card p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {formatCondition(copy.condition)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {copy.purchasePrice != null && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">{t("itemDetail.purchasePrice")}</span>
                          <p className="text-sm">${copy.purchasePrice.toFixed(2)}</p>
                        </div>
                      )}
                      {copy.estimatedValue != null && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">{t("itemDetail.estimatedValue")}</span>
                          <p className="text-sm">${copy.estimatedValue.toFixed(2)}</p>
                        </div>
                      )}
                      {copy.acquisitionDate && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">{t("itemDetail.acquisitionDate")}</span>
                          <p className="text-sm">{copy.acquisitionDate}</p>
                        </div>
                      )}
                      {copy.acquisitionSource && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">{t("itemDetail.acquisitionSource")}</span>
                          <p className="text-sm">{copy.acquisitionSource}</p>
                        </div>
                      )}
                    </div>
                    {copy.notes && (
                      <div className="mt-2">
                        <span className="text-xs font-medium text-muted-foreground">{t("itemDetail.notes")}</span>
                        <p className="text-sm">{copy.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
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
                value={formImage}
                onChange={(e) => setFormImage(e.target.value)}
                disabled={submitting}
              />
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
                {submitting ? t("collectionDetail.saving") : t("collectionDetail.save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("itemDetail.deleteTitle")}</DialogTitle>
            <DialogDescription>{t("itemDetail.deleteConfirm")}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              {t("collectionDetail.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? t("itemDetail.deleting") : t("itemDetail.delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
