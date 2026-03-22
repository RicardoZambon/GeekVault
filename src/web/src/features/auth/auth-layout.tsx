import { useTranslation } from "react-i18next"
import { FadeIn, ScaleIn } from "@/components/ds"
import { ShieldCheck } from "lucide-react"

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Decorative Brand Panel — hidden below lg */}
      <div
        className="relative hidden overflow-hidden lg:flex lg:w-[55%] items-center justify-center"
        style={{
          background: `
            radial-gradient(ellipse at 20% 50%, rgba(217, 119, 6, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(245, 158, 11, 0.10) 0%, transparent 50%),
            radial-gradient(ellipse at 60% 80%, rgba(217, 119, 6, 0.08) 0%, transparent 50%),
            #1C1917
          `,
        }}
      >
        {/* Floating blurred shapes */}
        <div className="absolute -left-20 -top-20 h-[300px] w-[300px] animate-[float_20s_ease-in-out_infinite] rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 h-[400px] w-[400px] animate-[float_20s_ease-in-out_infinite_5s] rounded-full bg-gradient-to-tl from-amber-500/15 to-stone-700/10 blur-3xl" />
        <div className="absolute left-1/3 top-1/4 h-[250px] w-[250px] animate-[float_20s_ease-in-out_infinite_10s] rounded-full bg-gradient-to-r from-amber-400/10 to-transparent blur-3xl" />

        {/* Brand content */}
        <ScaleIn>
          <div className="relative z-10 flex flex-col items-center px-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 backdrop-blur-sm">
              <ShieldCheck className="h-9 w-9 text-amber-500" />
            </div>
            <h1 className="mt-5 font-display text-3xl font-bold text-white">GeekVault</h1>
            <p className="mt-2 text-lg text-stone-400">{t("auth.tagline2")}</p>

            {/* Feature highlight card */}
            <div className="mt-12 max-w-sm rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <p className="text-sm leading-relaxed text-stone-300">
                {t("auth.featureHighlight")}
              </p>
            </div>
          </div>
        </ScaleIn>
      </div>

      {/* Form Panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background p-6 sm:p-8 lg:p-12">
        {/* Mobile Brand Header */}
        <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
          <ShieldCheck className="h-8 w-8 text-accent" />
          <span className="font-display text-xl font-bold text-foreground">GeekVault</span>
        </div>

        <div className="w-full max-w-sm">
          <FadeIn>{children}</FadeIn>
        </div>
      </div>
    </div>
  )
}
