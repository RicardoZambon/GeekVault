import { useTranslation } from "react-i18next"

export default function Wishlist() {
  const { t } = useTranslation()
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{t("wishlist.title")}</h1>
      <p className="mt-2 text-muted-foreground">
        {t("wishlist.description")}
      </p>
    </div>
  )
}
