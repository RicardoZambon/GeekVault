import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"

export default function CollectionDetail() {
  const { id } = useParams()
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">
        {t("collections.title")}
      </h1>
      <p className="mt-2 text-muted-foreground">
        Collection #{id}
      </p>
    </div>
  )
}
