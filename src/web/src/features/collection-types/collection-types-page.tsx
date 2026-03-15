import { useState, useEffect, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Pencil, Trash2, X, GripVertical, Layers } from "lucide-react"
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
  const [error, setError] = useState("")

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
      setError(t("collectionTypes.fetchError"))
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
    setDialogOpen(true)
  }

  function openEdit(ct: CollectionType) {
    setEditingId(ct.id)
    setFormName(ct.name)
    setFormDescription(ct.description)
    setFormIcon(ct.icon)
    setFormFields((ct.customFieldSchema ?? []).map((f) => ({ ...f, options: [...(f.options ?? [])] })))
    setFormError("")
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
      await fetchCollectionTypes()
    } catch {
      setError(t("collectionTypes.deleteFailed"))
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
  }

  function updateField(index: number, updates: Partial<CustomFieldDefinition>) {
    setFormFields(
      formFields.map((f, i) => (i === index ? { ...f, ...updates } : f))
    )
  }

  function addOption(fieldIndex: number) {
    const field = formFields[fieldIndex]
    updateField(fieldIndex, { options: [...field.options, ""] })
  }

  function updateOption(fieldIndex: number, optionIndex: number, value: string) {
    const field = formFields[fieldIndex]
    const options = field.options.map((o, i) => (i === optionIndex ? value : o))
    updateField(fieldIndex, { options })
  }

  function removeOption(fieldIndex: number, optionIndex: number) {
    const field = formFields[fieldIndex]
    updateField(fieldIndex, {
      options: field.options.filter((_, i) => i !== optionIndex),
    })
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
            {t("collectionTypes.title")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t("collectionTypes.description")}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t("collectionTypes.create")}
        </Button>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
          {error}
        </div>
      )}

      {collectionTypes.length === 0 ? (
        <EmptyState
          icon={<Layers />}
          title={t("emptyStates.collectionTypes.title")}
          description={t("emptyStates.collectionTypes.description")}
          actionLabel={t("emptyStates.collectionTypes.action")}
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collectionTypes.map((ct) => (
            <div
              key={ct.id}
              className="rounded-lg border bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {ct.icon && <span className="text-xl">{ct.icon}</span>}
                  <h3 className="font-semibold">{ct.name}</h3>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(ct)}
                    aria-label={t("collectionTypes.edit")}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(ct.id)}
                    aria-label={t("collectionTypes.delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {ct.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {ct.description}
                </p>
              )}
              {(ct.customFieldSchema ?? []).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {ct.customFieldSchema.map((f) => (
                    <span
                      key={f.name}
                      className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                    >
                      {f.name}
                      <span className="ml-1 opacity-60">({f.type})</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
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

            {/* Custom Fields Builder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t("collectionTypes.customFields")}</Label>
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

              {formFields.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t("collectionTypes.noFields")}
                </p>
              )}

              {formFields.map((field, index) => (
                <div
                  key={index}
                  className="rounded-lg border bg-muted/30 p-3 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {t("collectionTypes.fieldNumber", { n: index + 1 })}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => removeField(index)}
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
                        value={field.name}
                        onChange={(e) =>
                          updateField(index, { name: e.target.value })
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
                      <select
                        value={field.type}
                        onChange={(e) =>
                          updateField(index, {
                            type: e.target.value as FieldType,
                            options:
                              e.target.value === "enum" ? field.options : [],
                          })
                        }
                        disabled={submitting}
                        className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        {FIELD_TYPES.map((ft) => (
                          <option key={ft} value={ft}>
                            {t(`collectionTypes.fieldTypes.${ft}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end space-x-2 pb-0.5">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) =>
                            updateField(index, { required: e.target.checked })
                          }
                          disabled={submitting}
                          className="h-4 w-4 rounded border-input"
                        />
                        {t("collectionTypes.fieldRequired")}
                      </label>
                    </div>
                  </div>

                  {/* Enum options */}
                  {field.type === "enum" && (
                    <div className="space-y-2 pl-6">
                      <Label className="text-xs">
                        {t("collectionTypes.enumOptions")}
                      </Label>
                      {field.options.map((option, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <Input
                            value={option}
                            onChange={(e) =>
                              updateOption(index, oi, e.target.value)
                            }
                            placeholder={t(
                              "collectionTypes.enumOptionPlaceholder",
                              { n: oi + 1 }
                            )}
                            disabled={submitting}
                            className="h-7 text-sm"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => removeOption(index, oi)}
                            disabled={submitting}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => addOption(index)}
                        disabled={submitting}
                      >
                        <Plus className="h-3 w-3" />
                        {t("collectionTypes.addOption")}
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              {formFields.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("collectionTypes.fieldsCount", {
                    count: formFields.length,
                    max: 10,
                  })}
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
                {t("collectionTypes.cancel")}
              </Button>
              <Button type="submit" disabled={submitting}>
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("collectionTypes.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("collectionTypes.deleteConfirm")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={deleting}
            >
              {t("collectionTypes.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting
                ? t("collectionTypes.deleting")
                : t("collectionTypes.delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
