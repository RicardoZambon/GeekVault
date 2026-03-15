import { useEffect, useState, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/components/auth-provider"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  PageHeader,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  SkeletonRect,
  SkeletonCircle,
  SkeletonText,
  FadeIn,
  toast,
} from "@/components/ds"
import { Camera, Loader2, Moon, Sun, Monitor, User } from "lucide-react"

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
  const { theme, setTheme } = useTheme()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
      .catch(() => toast.error(t("profile.fetchError")))
      .finally(() => setLoading(false))
  }, [token])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

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

      toast.success(t("profile.saveSuccess"))
    } catch {
      toast.error(t("profile.saveFailed"))
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
      toast.success(t("profile.avatarSuccess"))
    } catch {
      toast.error(t("profile.avatarFailed"))
      setAvatarPreview(profile?.avatar ?? null)
    } finally {
      setUploadingAvatar(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <SkeletonRect className="h-8 w-32" />
          <SkeletonRect className="h-5 w-64" />
        </div>
        <Card>
          <CardContent className="flex items-center gap-6 pt-6">
            <SkeletonCircle size={120} />
            <SkeletonText lines={2} className="w-48" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <SkeletonRect className="h-5 w-24" />
            <SkeletonRect className="h-10 w-full" />
            <SkeletonRect className="h-5 w-24" />
            <SkeletonRect className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <SkeletonRect className="h-5 w-24" />
            <SkeletonRect className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const themeOptions: Array<{ value: string; icon: React.ReactNode; label: string }> = [
    { value: "light", icon: <Sun className="h-4 w-4" />, label: t("profile.sections.themeLight") },
    { value: "dark", icon: <Moon className="h-4 w-4" />, label: t("profile.sections.themeDark") },
    { value: "system", icon: <Monitor className="h-4 w-4" />, label: t("profile.sections.themeSystem") },
  ]

  return (
    <FadeIn>
      <div className="space-y-6">
        <PageHeader title={t("profile.title")} description={t("profile.description")} />

        {/* Avatar Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t("profile.sections.avatar")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div
                className="group relative h-[120px] w-[120px] shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-muted bg-muted"
                onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={t("profile.avatarLabel")}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <User className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                {uploadingAvatar ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{profile?.displayName || profile?.email}</p>
                <p className="text-xs text-muted-foreground">{t("profile.uploadAvatar")}</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Account Info Section */}
          <Card>
            <CardHeader>
              <CardTitle>{t("profile.sections.accountInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("profile.emailLabel")}</Label>
                <Input value={profile?.email ?? ""} disabled className="bg-muted/50" />
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
            </CardContent>
          </Card>

          {/* About Section */}
          <Card>
            <CardHeader>
              <CardTitle>{t("profile.sections.about")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="bio">{t("profile.bioLabel")}</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t("profile.bioPlaceholder")}
                  disabled={saving}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preferences Section */}
          <Card>
            <CardHeader>
              <CardTitle>{t("profile.sections.preferences")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("profile.languageLabel")}</Label>
                <Select
                  value={preferredLanguage}
                  onValueChange={setPreferredLanguage}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t("language.en")}</SelectItem>
                    <SelectItem value="pt">{t("language.pt")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("profile.currencyLabel")}</Label>
                <Select
                  value={preferredCurrency}
                  onValueChange={setPreferredCurrency}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">{t("profile.currencies.USD")}</SelectItem>
                    <SelectItem value="EUR">{t("profile.currencies.EUR")}</SelectItem>
                    <SelectItem value="GBP">{t("profile.currencies.GBP")}</SelectItem>
                    <SelectItem value="BRL">{t("profile.currencies.BRL")}</SelectItem>
                    <SelectItem value="JPY">{t("profile.currencies.JPY")}</SelectItem>
                    <SelectItem value="CAD">{t("profile.currencies.CAD")}</SelectItem>
                    <SelectItem value="AUD">{t("profile.currencies.AUD")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Appearance Section */}
          <Card>
            <CardHeader>
              <CardTitle>{t("profile.sections.appearance")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>{t("profile.sections.theme")}</Label>
                <div className="inline-flex items-center rounded-lg border bg-muted/50 p-1">
                  {themeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTheme(option.value as "light" | "dark" | "system")}
                      className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        theme === option.value
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button - sticky on mobile */}
          <div className="sticky bottom-4 z-10 flex sm:static sm:bottom-auto">
            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("profile.saving")}
                </>
              ) : (
                t("profile.save")
              )}
            </Button>
          </div>
        </form>
      </div>
    </FadeIn>
  )
}
