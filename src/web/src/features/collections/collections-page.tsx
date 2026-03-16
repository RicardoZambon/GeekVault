import { useState, useEffect, useRef, type FormEvent } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import {
  Plus,
  Pencil,
  Trash2,
  Library,
  Search,
  Upload,
  Loader2,
  Eye,
} from "lucide-react"
import {
  EmptyState,
  PageHeader,
  Card,
  CardContent,
  CardFooter,
  Badge,
  SkeletonRect,
  StaggerChildren,
  staggerItemVariants,
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
}

export default function Collections() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [collections, setCollections] = useState<Collection[]>([])
  const [collectionTypes, setCollectionTypes] = useState<CollectionType[]>([])
  const [loading, setLoading] = useState(true)

  // Search & filter
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const debouncedSearch = useDebounce(searchQuery, 300)

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

  async function fetchCollections() {
    try {
      const res = await fetch("/api/collections", { headers })
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setCollections(data)
    } catch {
      toast.error(t("collections.fetchError"))
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

  // Filtered collections
  const filteredCollections = collections.filter((c) => {
    const matchesSearch =
      !debouncedSearch ||
      c.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchesType =
      filterType === "all" || c.collectionTypeId === Number(filterType)
    return matchesSearch && matchesType
  })

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
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} variant="flat" className="overflow-hidden">
              <SkeletonRect height={144} className="w-full rounded-none" />
              <CardContent className="pt-4">
                <SkeletonRect height={20} width="60%" />
                <SkeletonRect height={14} width="30%" className="mt-2" />
                <SkeletonRect height={14} width="90%" className="mt-3" />
                <SkeletonRect height={14} width="75%" className="mt-1" />
                <SkeletonRect height={12} width="20%" className="mt-3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={t("collections.title")}
        actions={
          <Button
            onClick={openCreate}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {t("collections.create")}
          </Button>
        }
      />

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
          {/* Search & Filter toolbar */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("collections.searchPlaceholder")}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[200px]">
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
          </div>

          {/* Collection cards grid */}
          {filteredCollections.length === 0 ? (
            <div className="mt-12 text-center text-muted-foreground">
              {t("collections.noResults")}
            </div>
          ) : (
            <StaggerChildren className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCollections.map((c) => (
                <motion.div key={c.id} variants={staggerItemVariants}>
                  <Card className="group cursor-pointer overflow-hidden">
                    {/* Cover image */}
                    <div
                      className="relative aspect-video bg-muted"
                      onClick={() => navigate(`/collections/${c.id}`)}
                    >
                      {c.coverImage ? (
                        <img
                          src={c.coverImage}
                          alt={c.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                          <Library className="h-10 w-10 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className="min-w-0 flex-1 cursor-pointer"
                          onClick={() => navigate(`/collections/${c.id}`)}
                        >
                          <h3 className="truncate font-display font-semibold">
                            {c.name}
                          </h3>
                          <Badge variant="outline" size="sm" className="mt-1">
                            {c.collectionTypeName}
                          </Badge>
                        </div>
                        {/* Overflow menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                              onClick={(e) => e.stopPropagation()}
                              aria-label={t("collections.actions")}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="19" r="1" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                openEdit(c)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                              {t("collections.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteId(c.id)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              {t("collections.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {c.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {c.description}
                        </p>
                      )}
                    </CardContent>

                    <CardFooter className="justify-between border-t px-6 py-3">
                      <span className="text-xs font-medium text-muted-foreground">
                        {t("collections.itemCount", { count: c.itemCount })}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        /* v8 ignore next */
                        onClick={() => navigate(`/collections/${c.id}`)}
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        {t("collections.view")}
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </StaggerChildren>
          )}
        </>
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
              <div
                onDrop={handleDrop}
                /* v8 ignore next 2 */
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-8 text-center transition-colors hover:border-accent/50 hover:bg-accent/5"
              >
                <Upload className="mb-2 h-8 w-8 text-muted-foreground/50" />
                {formCoverFile ? (
                  <p className="text-sm font-medium text-foreground">
                    {formCoverFile.name}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("collections.dropCoverHere")}
                  </p>
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
