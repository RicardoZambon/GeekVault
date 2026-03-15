import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Library } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  StaggerChildren,
  staggerItemVariants,
  SkeletonRect,
} from "@/components/ds"

interface CollectionSummary {
  id: number
  name: string
  itemCount: number
  ownedCount: number
  value: number
}

interface CollectionSummariesProps {
  collections: CollectionSummary[]
  loading?: boolean
}

export function CollectionSummaries({ collections, loading }: CollectionSummariesProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div>
        <SkeletonRect width={200} height={24} className="mb-4" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-6 space-y-3">
              <SkeletonRect width="100%" height={120} className="rounded-md" />
              <SkeletonRect width="70%" height={18} />
              <SkeletonRect width="50%" height={14} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (collections.length === 0) return null

  return (
    <div>
      <h2 className="mb-4 font-display text-lg font-semibold">{t("dashboard.collectionSummaries")}</h2>
      <StaggerChildren className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((col) => (
          <motion.div key={col.id} variants={staggerItemVariants}>
            <Card
              className="cursor-pointer"
              onClick={() => navigate(`/collections/${col.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex h-24 items-center justify-center rounded-md bg-primary/5">
                  <Library className="h-10 w-10 text-primary/40" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="mb-2">{col.name}</CardTitle>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>{t("dashboard.items")}</span>
                    <span className="font-medium text-foreground">{col.itemCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("dashboard.owned")}</span>
                    <span className="font-medium text-foreground">{col.ownedCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("dashboard.value")}</span>
                    <span className="font-medium text-foreground">
                      ${col.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </StaggerChildren>
    </div>
  )
}
