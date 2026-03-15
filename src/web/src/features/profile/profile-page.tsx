import { useEffect, useState, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, User } from "lucide-react"

interface ProfileData {
  id: string
  email: string
  displayName: string | null
  avatar: string | null
  bio: string | null
  preferredLanguage: string | null
  preferredCurrency: string | null
}

export default function Profile() {
  const { t, i18n } = useTranslation()
  const { token } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [bio, setBio] = useState("")
  const [preferredLanguage, setPreferredLanguage] = useState("")
  const [preferredCurrency, setPreferredCurrency] = useState("")

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }

  useEffect(() => {
    fetch("/api/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error("Failed")
        return res.json()
      })
      .then((data: ProfileData) => {
        setProfile(data)
        setDisplayName(data.displayName ?? "")
        setBio(data.bio ?? "")
        setPreferredLanguage(data.preferredLanguage ?? "en")
        setPreferredCurrency(data.preferredCurrency ?? "USD")
        setAvatarPreview(data.avatar ?? null)
      })
      .catch(() => setError(t("profile.fetchError")))
      .finally(() => setLoading(false))
  }, [token])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSaveSuccess(false)

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          displayName,
          bio,
          preferredLanguage,
          preferredCurrency,
        }),
      })

      if (!res.ok) throw new Error("Failed")

      const data: ProfileData = await res.json()
      setProfile(data)

      // Update app language immediately
      if (data.preferredLanguage && data.preferredLanguage !== i18n.language) {
        i18n.changeLanguage(data.preferredLanguage)
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch {
      setError(t("profile.saveFailed"))
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview immediately
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setUploadingAvatar(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("avatar", file)

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!res.ok) throw new Error("Failed")

      const data = await res.json()
      setAvatarPreview(data.avatarUrl)
    } catch {
      setError(t("profile.avatarFailed"))
      setAvatarPreview(profile?.avatar ?? null)
    } finally {
      setUploadingAvatar(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("profile.loading")}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("profile.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("profile.description")}</p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {saveSuccess && (
        <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
          {t("profile.saveSuccess")}
        </div>
      )}

      {/* Avatar Section */}
      <div className="flex items-center gap-6">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border bg-muted">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt={t("profile.avatarLabel")}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          {uploadingAvatar && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </div>
          )}
        </div>
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploadingAvatar}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            {t("profile.uploadAvatar")}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="max-w-lg space-y-4">
        <div className="space-y-2">
          <Label>{t("profile.emailLabel")}</Label>
          <Input value={profile?.email ?? ""} disabled />
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">{t("profile.displayNameLabel")}</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t("profile.displayNamePlaceholder")}
            disabled={saving}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">{t("profile.bioLabel")}</Label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={t("profile.bioPlaceholder")}
            disabled={saving}
            rows={4}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="language">{t("profile.languageLabel")}</Label>
          <select
            id="language"
            value={preferredLanguage}
            onChange={(e) => setPreferredLanguage(e.target.value)}
            disabled={saving}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          >
            <option value="en">{t("language.en")}</option>
            <option value="pt">{t("language.pt")}</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">{t("profile.currencyLabel")}</Label>
          <select
            id="currency"
            value={preferredCurrency}
            onChange={(e) => setPreferredCurrency(e.target.value)}
            disabled={saving}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          >
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="BRL">BRL - Real Brasileiro</option>
            <option value="JPY">JPY - Japanese Yen</option>
            <option value="CAD">CAD - Canadian Dollar</option>
            <option value="AUD">AUD - Australian Dollar</option>
          </select>
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("profile.saving")}
            </>
          ) : (
            t("profile.save")
          )}
        </Button>
      </form>
    </div>
  )
}
