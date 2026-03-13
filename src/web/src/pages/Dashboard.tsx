import { useTranslation } from "react-i18next"

export default function Dashboard() {
  const { t } = useTranslation()
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.title")}</h1>
      <p className="mt-2 text-muted-foreground">
        {t("dashboard.description")}
      </p>
    </div>
  )
}
