import ByomaKusumaLogo from '@/assets/byoma-kusuma-logo.gif'

interface ByomaKusumaIconProps {
  className?: string
}

export function ByomaKusumaIcon({ className }: ByomaKusumaIconProps) {
  return (
    <img
      src={ByomaKusumaLogo}
      alt="Byoma Kusuma"
      className={className}
    />
  )
}