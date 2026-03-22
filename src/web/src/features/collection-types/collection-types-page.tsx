import { useState, useEffect, useRef, type FormEvent, type KeyboardEvent } from "react"
import { useTranslation } from "react-i18next"
import {
  Plus, Pencil, Trash2, X, GripVertical, Layers, Loader2, MoreVertical, AlertTriangle,
  Library, Disc, Film, Gamepad2, BookOpen, Camera, Stamp, Coins, Gem, Palette,
  Music, Trophy, Car, Watch, Shirt, Puzzle, Sword, MapPin, Globe, Star,
  Heart, Sparkles, Zap, Flame, Crown,
  type LucideIcon,
} from "lucide-react"
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
  Textarea,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
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

const FIELD_TYPE_COLORS: Record<FieldType, string> = {
  text: "bg-info/10 text-info",
  number: "bg-accent/10 text-accent",
  date: "bg-success/10 text-success",
  enum: "bg-chart-5/10 text-chart-5",
  boolean: "bg-muted text-muted-foreground",
  image_url: "bg-chart-6/10 text-chart-6",
}

const FIELD_TYPE_DOTS: Record<FieldType, string> = {
  text: "bg-info",
  number: "bg-accent",
  date: "bg-success",
  enum: "bg-chart-5",
  boolean: "bg-muted-foreground",
  image_url: "bg-chart-6",
}

const ICON_MAP: Record<string, LucideIcon> = {
  Library, Disc, Film, Gamepad2, BookOpen, Camera, Stamp, Coins, Gem, Palette,
  Music, Trophy, Car, Watch, Shirt, Puzzle, Sword, MapPin, Globe, Star,
  Heart, Sparkles, Zap, Flame, Crown,
}

const ICON_NAMES = Object.keys(ICON_MAP)

const MAX_VISIBLE_BADGES = 5

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

function TypeIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = ICON_MAP[icon]
  if (Icon) return <Icon className={className} />
  if (icon) return <span className={className}>{icon}</span>
  return <Layers className={className} />
}

export default function CollectionTypes() {
  const { t } = useTranslation()
  const { token } = useAuth()

  const [collectionTypes, setCollectionTypes] = useState<CollectionType[]>([])
  const [collectionCounts, setCollectionCounts] = useState<Record<number, number>>({})
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

  // Icon picker state
  const [iconPickerOpen, setIconPickerOpen] = useState(false)
  const iconPickerRef = useRef<HTMLDivElement>(null)

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
      const [typesRes, collectionsRes] = await Promise.all([
        fetch("/api/collection-types", { headers }),
        fetch("/api/collections", { headers }),
      ])
      if (!typesRes.ok) throw new Error("Failed to fetch")
      const typesData = await typesRes.json()
      setCollectionTypes(typesData.map((ct: CollectionType) => ({
        ...ct,
        customFieldSchema: ct.customFieldSchema ?? [],
      })))

      if (collectionsRes.ok) {
        const collectionsData = await collectionsRes.json()
        const counts: Record<number, number> = {}
        for (const col of collectionsData) {
          if (col.collectionTypeId) {
            counts[col.collectionTypeId] = (counts[col.collectionTypeId] ?? 0) + 1
          }
        }
        setCollectionCounts(counts)
      }
    } catch {
      toast.error(t("collectionTypes.fetchError"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCollectionTypes()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Close icon picker on outside click
  useEffect(() => {
    if (!iconPickerOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (iconPickerRef.current && !iconPickerRef.current.contains(e.target as Node)) {
        setIconPickerOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [iconPickerOpen])

  function openCreate() {
    setEditingId(null)
    setFormName("")
    setFormDescription("")
    setFormIcon("")
    setFormFields([])
    setFormError("")
    setEnumInputs({})
    setIconPickerOpen(false)
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
    setIconPickerOpen(false)
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

  const deleteType = deleteId !== null
    ? collectionTypes.find((ct) => ct.id === deleteId)
    : null
  const deleteCollectionCount = deleteId !== null ? (collectionCounts[deleteId] ?? 0) : 0

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <SkeletonRect width="200px" height="32px" />
            <SkeletonRect width="300px" height="20px" />
          </div>
          <SkeletonRect width="120px" height="36px" />
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <SkeletonRect width="40px" height="40px" className="rounded-lg" />
                <SkeletonRect width="120px" height="20px" />
              </div>
              <SkeletonText lines={2} />
              <div className="mt-3 flex gap-1.5">
                <SkeletonRect width="60px" height="22px" className="rounded-full" />
                <SkeletonRect width="80px" height="22px" className="rounded-full" />
                <SkeletonRect width="50px" height="22px" className="rounded-full" />
              </div>
              <div className="mt-3">
                <SkeletonRect width="160px" height="14px" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8" data-testid="collection-types-page">
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
          /* v8 ignore next */
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <StaggerChildren className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {collectionTypes.map((ct) => {
            const fields = ct.customFieldSchema ?? []
            const visibleFields = fields.slice(0, MAX_VISIBLE_BADGES)
            const overflowCount = fields.length - MAX_VISIBLE_BADGES
            const usageCount = collectionCounts[ct.id] ?? 0

            return (
              <motion.div key={ct.id} variants={staggerItemVariants} data-testid="type-card" data-type-id={ct.id}>
                <Card className="group h-full border border-border transition-all duration-150 hover:shadow-md hover:border-accent/30">
                  <CardContent className="p-5 max-sm:p-4 flex flex-col h-full">
                    {/* Icon + Title */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                        <TypeIcon icon={ct.icon} className="h-5 w-5 text-accent" />
                      </div>
                      <h4 className="text-base font-semibold text-card-foreground">{ct.name}</h4>
                    </div>

                    {/* Description */}
                    {ct.description && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {ct.description}
                      </p>
                    )}

                    {/* Field type badges */}
                    <div className="mt-3 flex flex-wrap gap-1.5" data-testid="field-badges">
                      {fields.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">
                          {t("collectionTypes.noFieldsBadge")}
                        </span>
                      ) : (
                        <>
                          {visibleFields.map((f) => (
                            <span
                              key={f.name}
                              data-testid="field-badge"
                              data-field-type={f.type}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${FIELD_TYPE_COLORS[f.type]}`}
                            >
                              {f.name}
                            </span>
                          ))}
                          {overflowCount > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                              +{overflowCount} {t("collectionTypes.moreFields")}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Metadata row */}
                    <p className="mt-3 text-xs text-muted-foreground">
                      {t("collectionTypes.fieldCount", { count: fields.length })}
                      <span className="mx-1.5">&middot;</span>
                      {t("collectionTypes.collectionCount", { count: usageCount })}
                    </p>

                    {/* Action row */}
                    <div className="border-t border-border mt-4 pt-3 flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(ct)}
                        aria-label={t("collectionTypes.edit")}
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        {t("collectionTypes.edit")}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={t("collectionTypes.moreActions")}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
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
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </StaggerChildren>
      )}

      {/* Create/Edit Dialog with Tabs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
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
                {/* Icon picker */}
                <div className="space-y-2">
                  <Label>{t("collectionTypes.iconLabel")}</Label>
                  <div className="relative" ref={iconPickerRef}>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => setIconPickerOpen(!iconPickerOpen)}
                      disabled={submitting}
                      data-testid="icon-picker-trigger"
                    >
                      {formIcon ? (
                        <>
                          <TypeIcon icon={formIcon} className="h-4 w-4" />
                          <span>{formIcon}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">{t("collectionTypes.selectIcon")}</span>
                      )}
                    </Button>
                    {iconPickerOpen && (
                      <div
                        className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover p-2 shadow-lg"
                        data-testid="icon-picker-grid"
                      >
                        <div className="grid grid-cols-5 gap-1">
                          {ICON_NAMES.map((name) => {
                            const Icon = ICON_MAP[name]
                            return (
                              <TooltipProvider key={name} delayDuration={300}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      className={`flex items-center justify-center rounded-md p-2 transition-colors hover:bg-accent/10 ${formIcon === name ? "bg-accent/15 ring-1 ring-accent" : ""}`}
                                      onClick={() => {
                                        setFormIcon(name)
                                        setIconPickerOpen(false)
                                      }}
                                      aria-label={name}
                                    >
                                      <Icon className="h-5 w-5 text-foreground" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">{name}</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ct-name">{t("collectionTypes.nameLabel")} *</Label>
                  <Input
                    id="ct-name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={t("collectionTypes.namePlaceholder")}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ct-description">
                    {t("collectionTypes.descriptionLabel")}
                  </Label>
                  <Textarea
                    id="ct-description"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder={t("collectionTypes.descriptionPlaceholder")}
                    disabled={submitting}
                    rows={3}
                    className="resize-y"
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
                    variant="ghost"
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
                /* v8 ignore start -- SortableList DnD rendering not simulatable in jsdom */
                ) : (
                  <SortableList
                    items={formFields.map((f, i) => ({ ...f, _index: i }))}
                    keyExtractor={(item) => item._index}
                    onReorder={(newOrder) => {
                      setFormFields(newOrder.map(({ _index: _, ...f }) => f))
                    }}
                    renderItem={(item, { dragHandleProps, isDragging }) => (
                      <div
                        className={`rounded-md border border-border bg-card p-3 space-y-3 ${isDragging ? "ring-2 ring-accent shadow-xl scale-[1.02]" : ""}`}
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
                            className="h-7 w-7 text-destructive/60 hover:text-destructive"
                            onClick={() => removeField(item._index)}
                            disabled={submitting}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
                                    <div className="flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full ${FIELD_TYPE_DOTS[ft]}`} />
                                      <span>{t(`collectionTypes.fieldTypes.${ft}`)}</span>
                                    </div>
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
                )
                /* v8 ignore stop */
                }
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
        description={
          deleteType
            ? t("collectionTypes.deleteConfirmNamed", { name: deleteType.name })
            : t("collectionTypes.deleteConfirm")
        }
        confirmLabel={t("collectionTypes.delete")}
        cancelLabel={t("collectionTypes.cancel")}
        loadingLabel={t("collectionTypes.deleting")}
        loading={deleting}
        variant="destructive"
        onConfirm={handleDelete}
      >
        {deleteCollectionCount > 0 && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 flex items-start gap-2" data-testid="delete-usage-warning">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">
              {t("collectionTypes.deleteWarning", { count: deleteCollectionCount })}
            </p>
          </div>
        )}
      </ConfirmDialog>
    </div>
  )
}
