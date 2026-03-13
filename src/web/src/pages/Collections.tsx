import { useTranslation } from "react-i18next"

export default function Collections() {
  const { t } = useTranslation()
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{t("collections.title")}</h1>
      <p className="mt-2 text-muted-foreground">
        {t("collections.description")}
      </p>
    </div>
  )
}
