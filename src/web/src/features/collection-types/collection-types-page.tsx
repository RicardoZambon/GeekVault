import { useState, useEffect, type FormEvent, type KeyboardEvent } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Pencil, Trash2, X, GripVertical, Layers, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import {
  EmptyState,
  PageHeader,
  Card,
  CardContent,
  Badge,
  StaggerChildren,
  staggerItemVariants,
  SkeletonRect,
  SkeletonText,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  SortableList,
  toast,
} from "@/components/ds"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

const FIELD_TYPES = ["text", "number", "date", "enum", "boolean", "image_url"] as const
type FieldType = (typeof FIELD_TYPES)[number]

interface CustomFieldDefinition {
  name: string
  type: FieldType
  required: boolean
  options: string[]
}

interface CollectionType {
  id: number
  name: string
  description: string
  icon: string
  customFieldSchema: CustomFieldDefinition[]
}

function emptyField(): CustomFieldDefinition {
  return { name: "", type: "text", required: false, options: [] }
}

export default function CollectionTypes() {
  const { t } = useTranslation()
  const { token } = useAuth()

  const [collectionTypes, setCollectionTypes] = useState<CollectionType[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formIcon, setFormIcon] = useState("")
  const [formFields, setFormFields] = useState<CustomFieldDefinition[]>([])
  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Enum tag input state
  const [enumInputs, setEnumInputs] = useState<Record<number, string>>({})

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }

  async function fetchCollectionTypes() {
    try {
      const res = await fetch("/api/collection-types", { headers })
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setCollectionTypes(data.map((ct: CollectionType) => ({
        ...ct,
        customFieldSchema: ct.customFieldSchema ?? [],
      })))
    } catch {
      toast.error(t("collectionTypes.fetchError"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCollectionTypes()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() {
    setEditingId(null)
    setFormName("")
    setFormDescription("")
    setFormIcon("")
    setFormFields([])
    setFormError("")
    setEnumInputs({})
    setDialogOpen(true)
  }

  function openEdit(ct: CollectionType) {
    setEditingId(ct.id)
    setFormName(ct.name)
    setFormDescription(ct.description)
    setFormIcon(ct.icon)
    setFormFields((ct.customFieldSchema ?? []).map((f) => ({ ...f, options: [...(f.options ?? [])] })))
    setFormError("")
    setEnumInputs({})
    setDialogOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError("")

    if (!formName.trim()) {
      setFormError(t("collectionTypes.nameRequired"))
      return
    }

    if (formFields.length > 10) {
      setFormError(t("collectionTypes.maxFields"))
      return
    }

    for (const field of formFields) {
      if (!field.name.trim()) {
        setFormError(t("collectionTypes.fieldNameRequired"))
        return
      }
      if (field.type === "enum" && field.options.length === 0) {
        setFormError(t("collectionTypes.enumOptionsRequired", { name: field.name }))
        return
      }
    }

    setSubmitting(true)
    try {
      const body = {
        name: formName.trim(),
        description: formDescription.trim(),
        icon: formIcon.trim(),
        customFields: formFields.map((f) => ({
          name: f.name.trim(),
          type: f.type,
          required: f.required,
          options: f.type === "enum" ? f.options : [],
        })),
      }

      const url = editingId
        ? `/api/collection-types/${editingId}`
        : "/api/collection-types"
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, { method, headers, body: JSON.stringify(body) })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message ?? t("collectionTypes.saveFailed"))
      }

      setDialogOpen(false)
      toast.success(editingId ? t("collectionTypes.saveSuccess") : t("collectionTypes.createSuccess"))
      await fetchCollectionTypes()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t("collectionTypes.saveFailed"))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (deleteId === null) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/collection-types/${deleteId}`, {
        method: "DELETE",
        headers,
      })
      if (!res.ok) throw new Error("Failed to delete")
      setDeleteId(null)
      toast.success(t("collectionTypes.deleteSuccess"))
      await fetchCollectionTypes()
    } catch {
      toast.error(t("collectionTypes.deleteFailed"))
    } finally {
      setDeleting(false)
    }
  }

  // Custom field builder helpers
  function addField() {
    if (formFields.length >= 10) return
    setFormFields([...formFields, emptyField()])
  }

  function removeField(index: number) {
    setFormFields(formFields.filter((_, i) => i !== index))
    // Clean up enum input for removed field
    setEnumInputs((prev) => {
      const next = { ...prev }
      delete next[index]
      return next
    })
  }

  function updateField(index: number, updates: Partial<CustomFieldDefinition>) {
    setFormFields(
      formFields.map((f, i) => (i === index ? { ...f, ...updates } : f))
    )
  }

  function addEnumOption(fieldIndex: number, value: string) {
    const trimmed = value.trim()
    if (!trimmed) return
    const field = formFields[fieldIndex]
    if (field.options.includes(trimmed)) return
    updateField(fieldIndex, { options: [...field.options, trimmed] })
    setEnumInputs((prev) => ({ ...prev, [fieldIndex]: "" }))
  }

  function removeOption(fieldIndex: number, optionIndex: number) {
    const field = formFields[fieldIndex]
    updateField(fieldIndex, {
      options: field.options.filter((_, i) => i !== optionIndex),
    })
  }

  function handleEnumKeyDown(fieldIndex: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      addEnumOption(fieldIndex, enumInputs[fieldIndex] ?? "")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <SkeletonRect width="200px" height="32px" />
            <SkeletonRect width="300px" height="20px" />
          </div>
          <SkeletonRect width="120px" height="36px" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <SkeletonRect width="48px" height="48px" className="rounded-lg" />
                <SkeletonRect width="120px" height="20px" />
              </div>
              <SkeletonText lines={2} />
              <div className="mt-3 flex gap-1">
                <SkeletonRect width="60px" height="22px" className="rounded-full" />
                <SkeletonRect width="80px" height="22px" className="rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("collectionTypes.title")}
        description={t("collectionTypes.description")}
        actions={
          <Button onClick={openCreate} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="h-4 w-4" />
            {t("collectionTypes.create")}
          </Button>
        }
      />

      {collectionTypes.length === 0 ? (
        <EmptyState
          icon={<Layers />}
          title={t("emptyStates.collectionTypes.title")}
          description={t("emptyStates.collectionTypes.description")}
          actionLabel={t("emptyStates.collectionTypes.action")}
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <StaggerChildren className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collectionTypes.map((ct) => (
            <motion.div key={ct.id} variants={staggerItemVariants}>
              <Card className="group h-full transition-shadow hover:shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {ct.icon && (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl">
                          {ct.icon}
                        </div>
                      )}
                      <h3 className="font-display text-lg font-bold">{ct.name}</h3>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label={t("collections.actions")}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(ct)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          {t("collectionTypes.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteId(ct.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("collectionTypes.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {ct.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {ct.description}
                    </p>
                  )}
                  {(ct.customFieldSchema ?? []).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {ct.customFieldSchema.map((f) => (
                        <Badge key={f.name} variant="outline" size="sm">
                          {f.name}
                          <span className="ml-1 opacity-60">({t(`collectionTypes.fieldTypes.${f.type}`)})</span>
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </StaggerChildren>
      )}

      {/* Create/Edit Dialog with Tabs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? t("collectionTypes.editTitle")
                : t("collectionTypes.createTitle")}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? t("collectionTypes.editDescription")
                : t("collectionTypes.createDescription")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
                {formError}
              </div>
            )}

            <Tabs defaultValue="general">
              <TabsList>
                <TabsTrigger value="general">{t("collectionTypes.tabGeneral")}</TabsTrigger>
                <TabsTrigger value="fields">
                  {t("collectionTypes.tabCustomFields")}
                  {formFields.length > 0 && (
                    <Badge variant="primary" size="sm" className="ml-2">
                      {formFields.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ct-name">{t("collectionTypes.nameLabel")}</Label>
                    <Input
                      id="ct-name"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder={t("collectionTypes.namePlaceholder")}
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ct-icon">{t("collectionTypes.iconLabel")}</Label>
                    <Input
                      id="ct-icon"
                      value={formIcon}
                      onChange={(e) => setFormIcon(e.target.value)}
                      placeholder={t("collectionTypes.iconPlaceholder")}
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ct-description">
                    {t("collectionTypes.descriptionLabel")}
                  </Label>
                  <Input
                    id="ct-description"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder={t("collectionTypes.descriptionPlaceholder")}
                    disabled={submitting}
                  />
                </div>
              </TabsContent>

              <TabsContent value="fields" className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {t("collectionTypes.fieldsCount", {
                      count: formFields.length,
                      max: 10,
                    })}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addField}
                    disabled={formFields.length >= 10 || submitting}
                  >
                    <Plus className="h-3 w-3" />
                    {t("collectionTypes.addField")}
                  </Button>
                </div>

                {formFields.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {t("collectionTypes.noFields")}
                  </p>
                ) : (
                  <SortableList
                    items={formFields.map((f, i) => ({ ...f, _index: i }))}
                    keyExtractor={(item) => item._index}
                    onReorder={(newOrder) => {
                      setFormFields(newOrder.map(({ _index: _, ...f }) => f))
                    }}
                    renderItem={(item, { dragHandleProps, isDragging }) => (
                      <div
                        className={`rounded-lg border bg-muted/30 p-3 space-y-3 ${isDragging ? "ring-2 ring-accent" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
                              {...dragHandleProps}
                            >
                              <GripVertical className="h-4 w-4" />
                            </button>
                            <span className="text-sm font-medium">
                              {t("collectionTypes.fieldNumber", { n: item._index + 1 })}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => removeField(item._index)}
                            disabled={submitting}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="space-y-1">
                            <Label className="text-xs">
                              {t("collectionTypes.fieldName")}
                            </Label>
                            <Input
                              value={item.name}
                              onChange={(e) =>
                                updateField(item._index, { name: e.target.value })
                              }
                              placeholder={t("collectionTypes.fieldNamePlaceholder")}
                              disabled={submitting}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">
                              {t("collectionTypes.fieldType")}
                            </Label>
                            <Select
                              value={item.type}
                              onValueChange={(val) =>
                                updateField(item._index, {
                                  type: val as FieldType,
                                  options: val === "enum" ? item.options : [],
                                })
                              }
                              disabled={submitting}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FIELD_TYPES.map((ft) => (
                                  <SelectItem key={ft} value={ft}>
                                    {t(`collectionTypes.fieldTypes.${ft}`)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-end space-x-2 pb-0.5">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={item.required}
                                onChange={(e) =>
                                  updateField(item._index, { required: e.target.checked })
                                }
                                disabled={submitting}
                                className="h-4 w-4 rounded border-input"
                              />
                              {t("collectionTypes.fieldRequired")}
                            </label>
                          </div>
                        </div>

                        {/* Enum tag editor */}
                        {item.type === "enum" && (
                          <div className="space-y-2 pl-6">
                            <Label className="text-xs">
                              {t("collectionTypes.enumOptions")}
                            </Label>
                            <div className="flex flex-wrap gap-1.5">
                              {item.options.map((option, oi) => (
                                <Badge key={oi} variant="default" size="sm" className="gap-1 pr-1">
                                  {option}
                                  <button
                                    type="button"
                                    onClick={() => removeOption(item._index, oi)}
                                    disabled={submitting}
                                    className="ml-0.5 rounded-full hover:bg-foreground/20 p-0.5"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                value={enumInputs[item._index] ?? ""}
                                onChange={(e) =>
                                  setEnumInputs((prev) => ({ ...prev, [item._index]: e.target.value }))
                                }
                                onKeyDown={(e) => handleEnumKeyDown(item._index, e)}
                                placeholder={t("collectionTypes.enumTagPlaceholder")}
                                disabled={submitting}
                                className="h-7 text-sm"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs shrink-0"
                                onClick={() => addEnumOption(item._index, enumInputs[item._index] ?? "")}
                                disabled={submitting}
                              >
                                <Plus className="h-3 w-3" />
                                {t("collectionTypes.addOption")}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  />
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                {t("collectionTypes.cancel")}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitting
                  ? t("collectionTypes.saving")
                  : editingId
                    ? t("collectionTypes.save")
                    : t("collectionTypes.create")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t("collectionTypes.deleteTitle")}
        description={t("collectionTypes.deleteConfirm")}
        confirmLabel={t("collectionTypes.delete")}
        cancelLabel={t("collectionTypes.cancel")}
        loadingLabel={t("collectionTypes.deleting")}
        loading={deleting}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
