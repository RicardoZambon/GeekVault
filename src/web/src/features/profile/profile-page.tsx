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
  StaggerChildren,
  toast,
} from "@/components/ds"
import { Camera, Loader2, Lock, Moon, Sun, Monitor, User } from "lucide-react"

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

  // Track initial values for dirty state
  const [initialValues, setInitialValues] = useState({
    displayName: "",
    bio: "",
    preferredLanguage: "",
    preferredCurrency: "",
  })

  const isDirty =
    displayName !== initialValues.displayName ||
    bio !== initialValues.bio ||
    preferredLanguage !== initialValues.preferredLanguage ||
    preferredCurrency !== initialValues.preferredCurrency

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
        const dn = data.displayName ?? ""
        const b = data.bio ?? ""
        const lang = data.preferredLanguage ?? "en"
        const curr = data.preferredCurrency ?? "USD"
        setDisplayName(dn)
        setBio(b)
        setPreferredLanguage(lang)
        setPreferredCurrency(curr)
        setInitialValues({ displayName: dn, bio: b, preferredLanguage: lang, preferredCurrency: curr })
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

      // Update initial values after save
      const dn = data.displayName ?? ""
      const b = data.bio ?? ""
      const lang = data.preferredLanguage ?? "en"
      const curr = data.preferredCurrency ?? "USD"
      setInitialValues({ displayName: dn, bio: b, preferredLanguage: lang, preferredCurrency: curr })

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
      <div className="space-y-6" data-testid="profile-skeleton">
        <div className="space-y-2">
          <SkeletonRect className="h-8 w-32" />
          <SkeletonRect className="h-5 w-64" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Avatar skeleton */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="flex flex-col items-center p-6">
                <SkeletonCircle size={96} />
                <SkeletonText lines={2} className="mt-4 w-32" />
              </CardContent>
            </Card>
          </div>
          {/* Form cards skeleton */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardContent className="space-y-4 p-6">
                <SkeletonRect className="h-5 w-32" />
                <SkeletonRect className="h-10 w-full" />
                <SkeletonRect className="h-5 w-24" />
                <SkeletonRect className="h-10 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-4 p-6">
                <SkeletonRect className="h-5 w-20" />
                <SkeletonRect className="h-24 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <SkeletonRect className="h-5 w-28 mb-4" />
                <div className="grid grid-cols-2 gap-4">
                  <SkeletonRect className="h-10 w-full" />
                  <SkeletonRect className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <SkeletonRect className="h-5 w-28 mb-4" />
                <div className="flex gap-2">
                  <SkeletonRect className="h-16 w-24" />
                  <SkeletonRect className="h-16 w-24" />
                  <SkeletonRect className="h-16 w-24" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const themeOptions: Array<{ value: string; icon: React.ReactNode; label: string }> = [
    { value: "light", icon: <Sun className="h-5 w-5" />, label: t("profile.sections.themeLight") },
    { value: "dark", icon: <Moon className="h-5 w-5" />, label: t("profile.sections.themeDark") },
    { value: "system", icon: <Monitor className="h-5 w-5" />, label: t("profile.sections.themeSystem") },
  ]

  return (
    <FadeIn>
      <div className="space-y-8">
        <PageHeader title={t("profile.title")} description={t("profile.description")} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column — Avatar Card */}
          <div className="lg:col-span-1">
            <StaggerChildren staggerDelay={0.06}>
              <FadeIn>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div
                      className="group relative mx-auto h-24 w-24 cursor-pointer overflow-hidden rounded-full border-2 border-border"
                      data-testid="profile-avatar"
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
                        <div className="flex h-full w-full items-center justify-center bg-accent/10">
                          <User className="h-10 w-10 text-accent" />
                        </div>
                      )}
                      {uploadingAvatar ? (
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                        </div>
                      ) : (
                        <div
                          className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                          data-testid="avatar-upload"
                        >
                          <Camera className="h-5 w-5 text-white" />
                          <span className="mt-1 text-xs text-white">{t("profile.avatarChange")}</span>
                        </div>
                      )}
                    </div>
                    <p className="mt-4 text-lg font-semibold text-card-foreground">
                      {profile?.displayName || profile?.email}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{profile?.email}</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </CardContent>
                </Card>
              </FadeIn>
            </StaggerChildren>
          </div>

          {/* Right Column — Form Cards */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSave} className="space-y-6">
              <StaggerChildren staggerDelay={0.06}>
                {/* Account Info Card */}
                <FadeIn>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">{t("profile.sections.accountInfo")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                        <Label>{t("profile.emailLabel")}</Label>
                        <div className="relative">
                          <Input
                            value={profile?.email ?? ""}
                            disabled
                            className="opacity-60 pr-10"
                          />
                          <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground">{t("profile.emailReadOnly")}</p>
                      </div>
                    </CardContent>
                  </Card>
                </FadeIn>

                {/* About Card */}
                <FadeIn>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">{t("profile.sections.about")}</CardTitle>
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
                          className="resize-y"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </FadeIn>

                {/* Preferences Card */}
                <FadeIn>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">{t("profile.sections.preferences")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      </div>
                    </CardContent>
                  </Card>
                </FadeIn>

                {/* Appearance Card */}
                <FadeIn>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">{t("profile.sections.appearance")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label>{t("profile.sections.theme")}</Label>
                        <div className="flex gap-2">
                          {themeOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              data-testid={`theme-${option.value}`}
                              onClick={() => setTheme(option.value as "light" | "dark" | "system")}
                              className={`flex flex-col items-center gap-1.5 rounded-lg border px-4 py-3 transition-all duration-150 cursor-pointer ${
                                theme === option.value
                                  ? "border-accent bg-accent/10 text-accent ring-1 ring-accent/30"
                                  : "border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                              }`}
                            >
                              {option.icon}
                              <span className="text-xs font-medium">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </FadeIn>

                {/* Save Button */}
                <FadeIn>
                  <div className="flex justify-end">
                    <div className="sticky bottom-4 z-10 w-full sm:static sm:bottom-auto sm:w-auto">
                      <Button
                        type="submit"
                        disabled={saving || !isDirty}
                        data-testid="profile-save"
                        className="w-full sm:w-auto"
                      >
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
                  </div>
                </FadeIn>
              </StaggerChildren>
            </form>
          </div>
        </div>
      </div>
    </FadeIn>
  )
}
