import { ShieldCheck, Award, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const TrustSection = () => {
  return (
    <section className="border-y border-border bg-background px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-2xl font-bold text-foreground md:text-3xl">
            Trusted & Certified
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Damianix Systems Ltd, the promoter of DamianixPro, is a registered member of the Real
            Estate Developers' Association of Nigeria (REDAN)
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-8 md:flex-row">
          {/* REDAN Badge */}
          <div className="flex max-w-sm flex-col items-center rounded-lg border-2 border-green-200 bg-gradient-to-br from-green-50 to-background p-6 shadow-sm dark:border-green-700/45 dark:from-green-950/35 dark:to-card">
            <div className="mb-4 rounded-full bg-green-100 p-4 dark:bg-green-900/40">
              <Award className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="mb-2 text-center text-lg font-bold text-foreground">REDAN Certified</h3>
            <p className="mb-3 text-center text-sm text-muted-foreground">
              Real Estate Developers' Association of Nigeria
            </p>
            <Badge
              variant="outline"
              className="border-green-300 bg-green-50 font-semibold text-green-700 dark:border-green-600/50 dark:bg-green-950/45 dark:text-green-300"
            >
              Membership No: NC/25/4428/DAM
            </Badge>
          </div>

          {/* Company Info */}
          <div className="flex max-w-sm flex-col items-center rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-background p-6 shadow-sm dark:border-blue-700/45 dark:from-blue-950/35 dark:to-card">
            <div className="mb-4 rounded-full bg-blue-100 p-4 dark:bg-blue-900/40">
              <Building2 className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="mb-2 text-center text-lg font-bold text-foreground">
              Damianix Systems Ltd
            </h3>
            <p className="text-center text-sm text-muted-foreground">Promoter of DamianixPro</p>
          </div>

          {/* Trust Badge */}
          <div className="flex max-w-sm flex-col items-center rounded-lg border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-background p-6 shadow-sm dark:border-purple-700/45 dark:from-purple-950/35 dark:to-card">
            <div className="mb-4 rounded-full bg-purple-100 p-4 dark:bg-purple-900/40">
              <ShieldCheck className="h-12 w-12 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="mb-2 text-center text-lg font-bold text-foreground">
              Verified & Trusted
            </h3>
            <p className="text-center text-sm text-muted-foreground">
              Industry-recognized platform for property management in Nigeria
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
