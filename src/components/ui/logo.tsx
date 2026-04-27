import { useWhiteLabel } from '@/contexts/WhiteLabelContext';

export function Logo() {
  const { brandName, logoUrl } = useWhiteLabel();
  const fallbackInitial = (brandName.trim().charAt(0) || 'D').toUpperCase();

  return (
    <div className="flex items-center">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${brandName} logo`}
          className="mr-2 h-8 w-8 rounded object-cover"
          loading="lazy"
        />
      ) : (
        <div className="mr-2 flex h-8 w-8 items-center justify-center rounded bg-primary font-bold text-primary-foreground">
          {fallbackInitial}
        </div>
      )}
    </div>
  );
}
