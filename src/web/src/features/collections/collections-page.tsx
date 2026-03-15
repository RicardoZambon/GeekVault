import { useState, useEffect, useRef, type FormEvent } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Plus, Pencil, Trash2, MoreVertical, Image, Library } from "lucide-react"
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

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
}

export default function Collections() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [collections, setCollections] = useState<Collection[]>([])
  const [collectionTypes, setCollectionTypes] = useState<CollectionType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

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

  // Card menu
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }

  async function fetchCollections() {
    try {
      const res = await fetch("/api/collections", { headers })
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setCollections(data)
    } catch {
      setError(t("collections.fetchError"))
    } finally {
      setLoading(false)
    }
  }

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

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null)
      }
    }
    if (menuOpenId !== null) {
      document.addEventListener("mousedown", handleClick)
      return () => document.removeEventListener("mousedown", handleClick)
    }
  }, [menuOpenId])

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
    setMenuOpenId(null)
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
      await fetchCollections()
    } catch {
      setError(t("collections.deleteFailed"))
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

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("collections.title")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t("collections.description")}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t("collections.create")}
        </Button>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
          {error}
        </div>
      )}

      {collections.length === 0 ? (
        <EmptyState
          icon={<Library />}
          title={t("emptyStates.collections.title")}
          description={t("emptyStates.collections.description")}
          actionLabel={t("emptyStates.collections.action")}
          onAction={openCreate}
        />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => (
            <div
              key={c.id}
              className="group relative cursor-pointer overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md"
              onClick={() => navigate(`/collections/${c.id}`)}
            >
              {/* Cover image */}
              <div className="relative h-36 bg-muted">
                {c.coverImage ? (
                  <img
                    src={c.coverImage}
                    alt={c.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Image className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                )}
              </div>

              {/* Card body */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">{c.name}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {c.collectionTypeName}
                    </p>
                  </div>
                  {/* Menu button */}
                  <div className="relative" ref={menuOpenId === c.id ? menuRef : null}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpenId(menuOpenId === c.id ? null : c.id)
                      }}
                      aria-label={t("collections.actions")}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                    {menuOpenId === c.id && (
                      <div className="absolute right-0 z-10 mt-1 w-36 rounded-md border bg-popover p-1 shadow-md">
                        <button
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEdit(c)
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          {t("collections.edit")}
                        </button>
                        <button
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-accent"
                          onClick={(e) => {
                            e.stopPropagation()
                            setMenuOpenId(null)
                            setDeleteId(c.id)
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {t("collections.delete")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {c.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {c.description}
                  </p>
                )}
                <p className="mt-3 text-xs font-medium text-muted-foreground">
                  {t("collections.itemCount", { count: c.itemCount })}
                </p>
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
              <Label htmlFor="col-type">{t("collections.typeLabel")}</Label>
              <select
                id="col-type"
                value={formTypeId}
                onChange={(e) =>
                  setFormTypeId(e.target.value ? Number(e.target.value) : "")
                }
                disabled={submitting || (editingId !== null)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
              >
                <option value="">{t("collections.selectType")}</option>
                {collectionTypes.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.icon ? `${ct.icon} ` : ""}{ct.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="col-cover">{t("collections.coverLabel")}</Label>
              <Input
                id="col-cover"
                type="file"
                accept="image/*"
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
