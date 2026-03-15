import { useTranslation } from "react-i18next"

export default function Home() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          {t("app.name")}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {t("home.tagline")}
        </p>
      </div>
    </div>
  )
}
