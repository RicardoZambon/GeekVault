import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { AlertCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FadeIn } from "@/components/ds"
import { AuthLayout } from "./auth-layout"

export default function Register() {
  const { t } = useTranslation()
  const { register } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")

    if (!displayName.trim()) {
      setError(t("auth.displayNameRequired"))
      return
    }
    if (!email.trim()) {
      setError(t("auth.emailRequired"))
      return
    }
    if (!password) {
      setError(t("auth.passwordRequired"))
      return
    }
    if (password.length < 6) {
      setError(t("auth.passwordTooShort"))
      return
    }

    setIsSubmitting(true)
    try {
      await register(email, password, displayName)
      navigate("/", { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.registerFailed"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            {t("auth.createYourVault")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("auth.registerDescription")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <FadeIn>
              <div
                className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
                data-testid="auth-error"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            </FadeIn>
          )}

          <div className="space-y-2">
            <Label htmlFor="displayName">{t("auth.displayName")}</Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("auth.displayNamePlaceholder")}
              autoComplete="name"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.emailPlaceholder")}
              autoComplete="email"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.passwordPlaceholder")}
              autoComplete="new-password"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">{t("auth.passwordHint")}</p>
          </div>

          <Button
            type="submit"
            className="h-11 w-full"
            disabled={isSubmitting}
            data-testid="auth-submit"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? t("auth.registering") : t("auth.register")}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {t("auth.hasAccount")}{" "}
          <Link
            to="/login"
            className="font-medium text-accent hover:underline"
            data-testid="auth-login-link"
          >
            {t("auth.loginLink")}
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
