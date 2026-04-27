import React from 'react';

interface TestimonialProps {
  quote: string;
  name: string;
  role: string;
  avatarUrl: string;
}

const Testimonial: React.FC<TestimonialProps> = ({ quote, name, role, avatarUrl }) => {
  return (
    <div className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
      <div className="mb-4 flex text-green-600 dark:text-green-400">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="mr-1"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </div>
      <p className="mb-4 italic text-foreground">"{quote}"</p>
      <div className="flex items-center">
        <img src={avatarUrl} alt={`${name} testimonial`} className="mr-3 h-10 w-10 rounded-full" />
        <div>
          <div className="font-medium text-foreground">{name}</div>
          <div className="text-sm text-muted-foreground">{role}</div>
        </div>
      </div>
    </div>
  );
};

export const TestimonialsSection = () => {
  return (
    <section className="border-y border-border bg-gradient-to-br from-green-50 to-background px-6 py-20 dark:from-muted/25 dark:to-background">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            What Our Users Say
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Hear from landlords, tenants, and property managers who have transformed their
            experience with DamianixPro.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <Testimonial
            quote="As a landlord with multiple properties, the automated rent collection has eliminated payment delays. I can now focus on property improvements instead of chasing payments."
            name="Oluwaseun Adeyemi"
            role="Landlord, Lagos"
            avatarUrl="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=faces"
          />

          <Testimonial
            quote="The 3D virtual tours saved me so much time. I found my perfect apartment without physically visiting dozens of properties. The maintenance system is also responsive."
            name="Ngozi Okafor"
            role="Tenant, Abuja"
            avatarUrl="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces"
          />

          <Testimonial
            quote="Managing 30+ properties was chaotic before DamianixPro. Now with the centralized dashboard, I've cut administrative work by 70% and improved tenant satisfaction."
            name="Chukwudi Eze"
            role="Property Manager, Port Harcourt"
            avatarUrl="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces"
          />
        </div>
      </div>
    </section>
  );
};
