import { useWhiteLabel } from '@/contexts/WhiteLabelContext';

type BrandTextProps = {
  className?: string;
  fallback?: string;
};

export function BrandText({ className, fallback = 'DamianixPro' }: BrandTextProps) {
  const { brandName } = useWhiteLabel();
  return <span className={className}>{brandName || fallback}</span>;
}
