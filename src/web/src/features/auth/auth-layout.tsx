import { useTranslation } from 'react-i18next'
import logoFull from '@/assets/logo-full.png'

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen">
      {/* Left brand panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[60%] items-center justify-center bg-gradient-to-br from-[#1B3A6B] via-[#142237] to-[#0D1B2A] relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-[-10%] left-[-5%] w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute bottom-[-15%] right-[-10%] w-96 h-96 rounded-full bg-[#E8A838]/10" />

        <div className="relative z-10 flex flex-col items-center gap-6 px-12 text-center">
          <img
            src={logoFull}
            alt="GeekVault"
            className="h-28 w-auto drop-shadow-lg"
          />
          <p className="max-w-md text-lg text-white/80 font-medium leading-relaxed">
            {t('auth.tagline')}
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full lg:w-[40%] items-center justify-center bg-background px-6 py-12">
        {/* Mobile brand header */}
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center gap-4 mb-8 lg:hidden">
            <img
              src={logoFull}
              alt="GeekVault"
              className="h-16 w-auto"
            />
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
