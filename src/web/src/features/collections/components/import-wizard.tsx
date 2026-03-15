import { useState, useCallback, useRef, type DragEvent } from "react"
import { useTranslation } from "react-i18next"
import { Upload, CheckCircle, AlertCircle, FileText, Loader2 } from "lucide-react"
import { toast, Badge } from "@/components/ds"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface ImportPreviewRow {
  rowNumber: number
  data: Record<string, string>
  errors: string[]
}

interface ImportPreviewData {
  rows: ImportPreviewRow[]
  validCount: number
  errorCount: number
}

interface ImportWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collectionId: string
  token: string
  onImportComplete: () => void
}

type Step = 1 | 2 | 3

export function ImportWizard({ open, onOpenChange, collectionId, token, onImportComplete }: ImportWizardProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>(1)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [previewData, setPreviewData] = useState<ImportPreviewData | null>(null)
  const [importedCount, setImportedCount] = useState(0)

  function resetState() {
    setStep(1)
    setFile(null)
    setDragging(false)
    setPreviewing(false)
    setConfirming(false)
    setPreviewData(null)
    setImportedCount(0)
  }

  function handleOpenChange(open: boolean) {
    if (!open) resetState()
    onOpenChange(open)
  }

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
  }, [])

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.name.endsWith(".csv")) {
      setFile(droppedFile)
    } else {
      toast.error(t("collectionDetail.importNoFile"))
    }
  }, [t])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
  }

  async function handlePreview() {
    if (!file) return
    setPreviewing(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch(`/api/collections/${collectionId}/import/preview`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message ?? t("collectionDetail.importPreviewFailed"))
      }
      const data: ImportPreviewData = await res.json()
      setPreviewData(data)
      setStep(2)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("collectionDetail.importPreviewFailed"))
    } finally {
      setPreviewing(false)
    }
  }

  async function handleConfirm() {
    if (!file) return
    setConfirming(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch(`/api/collections/${collectionId}/import/confirm`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message ?? t("collectionDetail.importFailed"))
      }
      const data = await res.json()
      setImportedCount(data.importedCount)
      setStep(3)
      onImportComplete()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("collectionDetail.importFailed"))
    } finally {
      setConfirming(false)
    }
  }

  const steps = [
    { num: 1 as Step, label: t("collectionDetail.importStepUpload") },
    { num: 2 as Step, label: t("collectionDetail.importStepPreview") },
    { num: 3 as Step, label: t("collectionDetail.importStepConfirm") },
  ]

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("collectionDetail.importTitle")}</DialogTitle>
          <DialogDescription>{t("collectionDetail.importDescription")}</DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    step > s.num
                      ? "bg-success text-success-foreground"
                      : step === s.num
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s.num ? <CheckCircle className="h-4 w-4" /> : s.num}
                </div>
                <span
                  className={`text-xs font-medium ${
                    step >= s.num ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`h-px w-8 ${
                    step > s.num ? "bg-success" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                dragging
                  ? "border-accent bg-accent/5"
                  : file
                    ? "border-success bg-success/5"
                    : "border-muted-foreground/25 hover:border-accent/50 hover:bg-accent/5"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              {file ? (
                <>
                  <FileText className="mb-3 h-10 w-10 text-success" />
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("collectionDetail.importClickToChange")}
                  </p>
                </>
              ) : (
                <>
                  <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {t("collectionDetail.importDropHere")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("collectionDetail.importOrBrowse")}
                  </p>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                {t("collectionDetail.importCancel")}
              </Button>
              <Button onClick={handlePreview} disabled={previewing || !file}>
                {previewing && <Loader2 className="h-4 w-4 animate-spin" />}
                {previewing ? t("collectionDetail.importPreviewing") : t("collectionDetail.importNext")}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 2 && previewData && (
          <div className="space-y-4">
            {/* Summary badges */}
            <div className="flex flex-wrap gap-3">
              <Badge variant="success">
                <CheckCircle className="mr-1 h-3.5 w-3.5" />
                {t("collectionDetail.importValidRows", { count: previewData.validCount })}
              </Badge>
              {previewData.errorCount > 0 && (
                <Badge variant="destructive">
                  <AlertCircle className="mr-1 h-3.5 w-3.5" />
                  {t("collectionDetail.importErrorRows", { count: previewData.errorCount })}
                </Badge>
              )}
            </div>

            {/* Preview table */}
            <div className="max-h-60 overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">{t("collectionDetail.importRow")}</th>
                    {previewData.rows.length > 0 &&
                      Object.keys(previewData.rows[0].data).map((key) => (
                        <th key={key} className="px-3 py-2 text-left font-medium">
                          {key}
                        </th>
                      ))}
                    <th className="px-3 py-2 text-left font-medium">{t("collectionDetail.importErrors")}</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.rows.map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={row.errors.length > 0 ? "bg-destructive/5" : ""}
                    >
                      <td className="px-3 py-1.5">{row.rowNumber}</td>
                      {Object.values(row.data).map((val, i) => (
                        <td key={i} className="max-w-[150px] truncate px-3 py-1.5">
                          {val}
                        </td>
                      ))}
                      <td className="px-3 py-1.5 text-xs text-destructive">
                        {row.errors.join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => { setStep(1); setPreviewData(null) }}
                disabled={confirming}
              >
                {t("collectionDetail.importBack")}
              </Button>
              <Button onClick={handleConfirm} disabled={confirming || previewData.validCount === 0}>
                {confirming && <Loader2 className="h-4 w-4 animate-spin" />}
                {confirming
                  ? t("collectionDetail.importConfirming")
                  : t("collectionDetail.importConfirmCount", { count: previewData.validCount })}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle className="h-12 w-12 text-success" />
              <p className="text-center text-sm font-medium">
                {t("collectionDetail.importSuccess", { count: importedCount })}
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => handleOpenChange(false)}>
                {t("collectionDetail.importDone")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
