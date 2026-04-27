import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export const CallToActionSection = () => {
  return (
    <section className="bg-gradient-to-r from-green-600 to-green-400 px-6 py-20 text-white">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="mb-6 text-3xl font-bold md:text-4xl">
          Ready to Transform Your Property Experience?
        </h2>
        <p className="mb-8 text-xl opacity-90">
          Join thousands of landlords, tenants, and property managers across Nigeria who are already
          benefiting from our platform. Whether you're looking for short-let accommodations or
          long-term rentals, we've got you covered.
        </p>
        <Link to="/auth">
          <Button
            size="lg"
            variant="secondary"
            className="border border-border bg-card px-8 text-lg text-primary hover:bg-muted/60"
          >
            Get Started Now
          </Button>
        </Link>
      </div>
    </section>
  );
};
